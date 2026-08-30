using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.CreateCheck;

internal static class CreateCheckEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPost(string.Empty, HandleAsync)
            .WithName("CreateServiceHealthCheck")
            .WithSummary("Creates a custom service-health check definition in the current environment.");

    private static async Task<Results<Created<ServiceHealthCheckResponse>, ValidationProblem, ProblemHttpResult>> HandleAsync(
        CreateServiceHealthCheckRequest request,
        IValidator<CreateServiceHealthCheckRequest> validator,
        AppDbContext db,
        IEnvironmentContext environment,
        HttpContext http,
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

        var entity = ToEntity(request, environment.Environment);

        if (await ServiceHealthWriteRules.DuplicateExistsAsync(
                db, environment.Environment, entity.Method, entity.NormalizedUrl, excludingId: null, ct))
        {
            return ServiceHealthWriteRules.DuplicateProblem(environment.Environment, entity.Method, entity.Url);
        }

        db.ServiceHealthChecks.Add(entity);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ServiceHealthWriteRules.IsUniqueViolation(ex))
        {
            return ServiceHealthWriteRules.DuplicateProblem(environment.Environment, entity.Method, entity.Url);
        }

        var location = $"{http.Request.Path.Value?.TrimEnd('/')}/{entity.Id}";
        return TypedResults.Created(location, entity.ToResponse());
    }

    private static ServiceHealthCheck ToEntity(CreateServiceHealthCheckRequest request, ServiceEnvironment environment)
    {
        ServiceHealthHttpMethodExtensions.TryParse(request.Method, out var method);
        return new ServiceHealthCheck(
            Guid.CreateVersion7(),
            environment,
            request.Name,
            request.Group,
            method,
            request.Url,
            request.Headers,
            request.Body,
            request.ExpectedStatus ?? 200,
            request.IsEnabled ?? true,
            ServiceHealthSource.Custom);
    }
}
