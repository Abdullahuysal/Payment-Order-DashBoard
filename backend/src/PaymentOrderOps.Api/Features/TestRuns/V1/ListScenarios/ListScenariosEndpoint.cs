using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.ListScenarios;

internal static class ListScenariosEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("scenarios", HandleAsync)
            .WithName("ListTestScenarios")
            .WithSummary("Lists the built-in test scenarios (global; not environment-scoped).");

    private static async Task<Ok<IReadOnlyList<ScenarioResponse>>> HandleAsync(AppDbContext db, CancellationToken ct)
    {
        var scenarios = await db.TestScenarios.AsNoTracking().OrderBy(s => s.Key).ToListAsync(ct);
        IReadOnlyList<ScenarioResponse> payload = [.. scenarios.Select(s => s.ToResponse())];
        return TypedResults.Ok(payload);
    }
}
