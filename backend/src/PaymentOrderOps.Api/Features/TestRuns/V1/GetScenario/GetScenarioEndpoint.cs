using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Infrastructure.Persistence;
using PaymentOrderOps.Infrastructure.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.GetScenario;

internal static class GetScenarioEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("scenarios/{idOrKey}", HandleAsync)
            .WithName("GetTestScenario")
            .WithSummary("Gets one scenario with its step timeline and bulk limits. Accepts an id or a key.");

    private static async Task<Results<Ok<ScenarioDetailResponse>, NotFound>> HandleAsync(
        string idOrKey, AppDbContext db, TestRunsOptions limits, CancellationToken ct)
    {
        var scenario = await ScenarioLookup.FindAsync(db, idOrKey, ct);
        return scenario is null ? TypedResults.NotFound() : TypedResults.Ok(scenario.ToDetail(limits));
    }
}
