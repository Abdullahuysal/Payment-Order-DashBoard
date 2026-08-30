using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.GetRun;

internal static class GetRunEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("{runId:guid}", HandleAsync)
            .WithName("GetTestRun")
            .WithSummary("Gets one run with its steps, variables and (for a bulk run) iterations and summary.");

    private static async Task<Results<Ok<RunResponse>, NotFound>> HandleAsync(
        Guid runId, AppDbContext db, IEnvironmentContext environment, CancellationToken ct)
    {
        var response = await RunResponseBuilder.BuildAsync(db, runId, environment.Environment, ct);
        return response is null ? TypedResults.NotFound() : TypedResults.Ok(response);
    }
}
