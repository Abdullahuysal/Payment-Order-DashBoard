using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

internal static class ProfileWriteRules
{
    public static Task<bool> DuplicateExistsAsync(
        AppDbContext db,
        Guid scenarioId,
        ServiceEnvironment environment,
        string normalizedName,
        Guid? excludingId,
        CancellationToken ct) =>
        db.ScenarioProfiles.AnyAsync(
            p => p.ScenarioId == scenarioId
                 && p.Environment == environment
                 && p.NormalizedName == normalizedName
                 && (excludingId == null || p.Id != excludingId),
            ct);

    public static ProblemHttpResult DuplicateProblem(string name) =>
        TypedResults.Problem(
            title: "Duplicate profile name.",
            detail: $"A profile named '{name}' already exists for this scenario in this environment.",
            statusCode: StatusCodes.Status409Conflict);

    public static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
