using Asp.Versioning;
using Asp.Versioning.Builder;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.ServiceHealth;

public static class ServiceHealthEndpoints
{
    public static IEndpointRouteBuilder MapServiceHealthEndpoints(this IEndpointRouteBuilder app, ApiVersionSet versionSet)
    {
        var group = app.MapGroup("/api/v{version:apiVersion}/service-health/checks")
            .WithApiVersionSet(versionSet)
            .MapToApiVersion(1)
            .WithTags("Service Health")
            .WithDescription(
                $"Every request requires the `{EnvironmentContextEndpointFilter.HeaderName}` header " +
                "(`dev`, `preprod` or `production`); it scopes all reads and writes to that environment.")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .AddEndpointFilter<EnvironmentContextEndpointFilter>();

        group.MapGet(string.Empty, ListAsync)
            .WithName("ListServiceHealthChecks")
            .WithSummary("Lists the current environment's service-health check definitions.");

        group.MapGet("{id:guid}", GetAsync)
            .WithName("GetServiceHealthCheck")
            .WithSummary("Gets a single service-health check definition scoped to the current environment.");

        group.MapPost(string.Empty, CreateAsync)
            .WithName("CreateServiceHealthCheck")
            .WithSummary("Creates a custom service-health check definition in the current environment.");

        group.MapPut("{id:guid}", ReplaceAsync)
            .WithName("ReplaceServiceHealthCheck")
            .WithSummary("Replaces an existing service-health check definition in the current environment.");

        group.MapDelete("{id:guid}", DeleteAsync)
            .WithName("DeleteServiceHealthCheck")
            .WithSummary("Soft-deletes a service-health check definition in the current environment.");

        return app;
    }

    private static async Task<Ok<IReadOnlyList<ServiceHealthCheckResponse>>> ListAsync(
        AppDbContext db, IEnvironmentContext environment, CancellationToken ct)
    {
        var entities = await db.ServiceHealthChecks
            .AsNoTracking()
            .Where(x => x.Environment == environment.Environment)
            .OrderBy(x => x.Source)
            .ThenBy(x => x.Name)
            .ToListAsync(ct);

        IReadOnlyList<ServiceHealthCheckResponse> payload = [.. entities.Select(ServiceHealthMapping.ToResponse)];
        return TypedResults.Ok(payload);
    }

    private static async Task<Results<Ok<ServiceHealthCheckResponse>, NotFound>> GetAsync(
        Guid id, AppDbContext db, IEnvironmentContext environment, CancellationToken ct)
    {
        var entity = await db.ServiceHealthChecks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.Environment == environment.Environment, ct);

        return entity is null ? TypedResults.NotFound() : TypedResults.Ok(entity.ToResponse());
    }

    private static async Task<Results<Created<ServiceHealthCheckResponse>, ValidationProblem, ProblemHttpResult>> CreateAsync(
        CreateServiceHealthCheckRequest request,
        IValidator<CreateServiceHealthCheckRequest> validator,
        AppDbContext db,
        IEnvironmentContext environment,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        if (EnvironmentMismatch(request.Environment, environment.Environment) is { } mismatch)
        {
            return mismatch;
        }

        var entity = request.ToNewEntity(environment.Environment);

        if (await DuplicateExistsAsync(db, environment.Environment, entity.Method, entity.NormalizedUrl, excludingId: null, ct))
        {
            return DuplicateProblem(environment.Environment, entity.Method, entity.Url);
        }

        db.ServiceHealthChecks.Add(entity);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return DuplicateProblem(environment.Environment, entity.Method, entity.Url);
        }

        return TypedResults.Created($"/api/v1/service-health/checks/{entity.Id}", entity.ToResponse());
    }

    private static async Task<Results<Ok<ServiceHealthCheckResponse>, NotFound, ValidationProblem, ProblemHttpResult>> ReplaceAsync(
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

        if (EnvironmentMismatch(request.Environment, environment.Environment) is { } mismatch)
        {
            return mismatch;
        }

        var entity = await db.ServiceHealthChecks
            .FirstOrDefaultAsync(x => x.Id == id && x.Environment == environment.Environment, ct);
        if (entity is null)
        {
            return TypedResults.NotFound();
        }

        entity.ApplyUpdate(request);

        if (await DuplicateExistsAsync(db, environment.Environment, entity.Method, entity.NormalizedUrl, excludingId: id, ct))
        {
            return DuplicateProblem(environment.Environment, entity.Method, entity.Url);
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
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return DuplicateProblem(environment.Environment, entity.Method, entity.Url);
        }

        return TypedResults.Ok(entity.ToResponse());
    }

    private static async Task<Results<NoContent, NotFound>> DeleteAsync(
        Guid id, AppDbContext db, IEnvironmentContext environment, CancellationToken ct)
    {
        var entity = await db.ServiceHealthChecks
            .FirstOrDefaultAsync(x => x.Id == id && x.Environment == environment.Environment, ct);
        if (entity is null)
        {
            return TypedResults.NotFound();
        }

        entity.SoftDelete();
        await db.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }

    private static ValidationProblem? EnvironmentMismatch(ServiceEnvironment? requested, ServiceEnvironment current)
    {
        if (requested is null || requested == current)
        {
            return null;
        }

        return TypedResults.ValidationProblem(new Dictionary<string, string[]>
        {
            ["environment"] =
            [
                $"Body environment '{requested}' does not match the {EnvironmentContextEndpointFilter.HeaderName} header '{current}'.",
            ],
        });
    }

    private static Task<bool> DuplicateExistsAsync(
        AppDbContext db,
        ServiceEnvironment environment,
        ServiceHealthHttpMethod method,
        string normalizedUrl,
        Guid? excludingId,
        CancellationToken ct) =>
        db.ServiceHealthChecks.AnyAsync(
            x => x.Environment == environment
                 && (excludingId == null || x.Id != excludingId)
                 && x.Method == method
                 && x.NormalizedUrl == normalizedUrl,
            ct);

    private static ProblemHttpResult DuplicateProblem(ServiceEnvironment environment, ServiceHealthHttpMethod method, string url) =>
        TypedResults.Problem(
            title: "Duplicate service-health check.",
            detail: $"A check for {method.ToWireValue()} {url} already exists in {environment}.",
            statusCode: StatusCodes.Status409Conflict);

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
