using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.DeleteProfile;

internal static class DeleteProfileEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapDelete("scenarios/{idOrKey}/profiles/{profileId:guid}", HandleAsync)
            .WithName("DeleteScenarioProfile")
            .WithSummary("Deletes a profile in the current environment.");

    private static async Task<Results<NoContent, NotFound>> HandleAsync(
        string idOrKey,
        Guid profileId,
        AppDbContext db,
        IEnvironmentContext environment,
        CancellationToken ct)
    {
        var scenarioId = await ScenarioLookup.FindIdAsync(db, idOrKey, ct);
        if (scenarioId == Guid.Empty)
        {
            return TypedResults.NotFound();
        }

        var profile = await db.ScenarioProfiles
            .FirstOrDefaultAsync(
                p => p.Id == profileId && p.ScenarioId == scenarioId && p.Environment == environment.Environment, ct);
        if (profile is null)
        {
            return TypedResults.NotFound();
        }

        db.ScenarioProfiles.Remove(profile);
        await db.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }
}
