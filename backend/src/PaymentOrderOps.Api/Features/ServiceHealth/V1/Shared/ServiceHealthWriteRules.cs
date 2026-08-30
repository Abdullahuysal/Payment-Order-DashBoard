using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;

/// <summary>
/// Cross-cutting write invariants shared by the create and replace slices:
/// the body/header environment must agree, and <c>(environment, method, normalized url)</c>
/// must stay unique (checked up front and again via the DB unique index).
/// </summary>
internal static class ServiceHealthWriteRules
{
    public static ValidationProblem? EnvironmentMismatch(ServiceEnvironment? requested, ServiceEnvironment current)
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

    public static Task<bool> DuplicateExistsAsync(
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

    public static ProblemHttpResult DuplicateProblem(ServiceEnvironment environment, ServiceHealthHttpMethod method, string url) =>
        TypedResults.Problem(
            title: "Duplicate service-health check.",
            detail: $"A check for {method.ToWireValue()} {url} already exists in {environment}.",
            statusCode: StatusCodes.Status409Conflict);

    public static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
