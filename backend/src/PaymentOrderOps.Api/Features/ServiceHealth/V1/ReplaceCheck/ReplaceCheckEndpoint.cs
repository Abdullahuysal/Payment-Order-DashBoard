using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.ReplaceCheck;

internal static class ReplaceCheckEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPut("{id:guid}", HandleAsync)
            .WithName("ReplaceServiceHealthCheck")
            .WithSummary("Replaces an existing service-health check definition in the current environment.");

    private static async Task<Results<Ok<ServiceHealthCheckResponse>, NotFound, ValidationProblem, ProblemHttpResult>> HandleAsync(
        Guid id,
        UpdateServiceHealthCheckRequest request,
        IValidator<UpdateServiceHealthCheckRequest> validator,
        AppDbContext db,
        IEnvironmentContext environment,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        if (ServiceHealthWriteRules.EnvironmentMismatch(request.Environment, environment.Environment) is { } mismatch)
        {
            return mismatch;
        }

        var entity = await db.ServiceHealthChecks
            .FirstOrDefaultAsync(x => x.Id == id && x.Environment == environment.Environment, ct);
        if (entity is null)
        {
            return TypedResults.NotFound();
        }

        ApplyUpdate(entity, request);

        if (await ServiceHealthWriteRules.DuplicateExistsAsync(
                db, environment.Environment, entity.Method, entity.NormalizedUrl, excludingId: id, ct))
        {
            return ServiceHealthWriteRules.DuplicateProblem(environment.Environment, entity.Method, entity.Url);
        }

        if (!string.IsNullOrWhiteSpace(request.RowVersion) && uint.TryParse(request.RowVersion, out var expectedXmin))
        {
            db.Entry(entity).Property(e => e.Xmin).OriginalValue = expectedXmin;
        }

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return TypedResults.Problem(
                title: "The resource was modified by another request.",
                detail: "Re-read the resource and retry with the latest rowVersion.",
                statusCode: StatusCodes.Status409Conflict);
        }
        catch (DbUpdateException ex) when (ServiceHealthWriteRules.IsUniqueViolation(ex))
        {
            return ServiceHealthWriteRules.DuplicateProblem(environment.Environment, entity.Method, entity.Url);
        }

        return TypedResults.Ok(entity.ToResponse());
    }

    private static void ApplyUpdate(ServiceHealthCheck entity, UpdateServiceHealthCheckRequest request)
    {
        ServiceHealthHttpMethodExtensions.TryParse(request.Method, out var method);
        entity.Update(
            request.Name,
            request.Group,
            method,
            request.Url,
            request.Headers,
            request.Body,
            request.ExpectedStatus ?? 200,
            request.IsEnabled ?? true);
    }
}
