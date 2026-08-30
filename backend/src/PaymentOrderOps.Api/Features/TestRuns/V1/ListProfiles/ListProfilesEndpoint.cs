using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.ListProfiles;

internal static class ListProfilesEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("scenarios/{idOrKey}/profiles", HandleAsync)
            .WithName("ListScenarioProfiles")
            .WithSummary("Lists the current environment's saved profiles for a scenario.");

    private static async Task<Results<Ok<IReadOnlyList<ProfileResponse>>, NotFound>> HandleAsync(
        string idOrKey, AppDbContext db, IEnvironmentContext environment, CancellationToken ct)
    {
        var scenarioId = await ScenarioLookup.FindIdAsync(db, idOrKey, ct);
        if (scenarioId == Guid.Empty)
        {
            return TypedResults.NotFound();
        }

        var profiles = await db.ScenarioProfiles.AsNoTracking()
            .Where(p => p.ScenarioId == scenarioId && p.Environment == environment.Environment)
            .OrderByDescending(p => p.UpdatedAtUtc)
            .ToListAsync(ct);

        IReadOnlyList<ProfileResponse> payload = [.. profiles.Select(p => p.ToResponse())];
        return TypedResults.Ok(payload);
    }
}
