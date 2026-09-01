using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.Logs.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Logs.V1.SavedQueries;

internal static class GetSavedQueriesEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("saved-queries", HandleAsync)
            .WithName("GetSavedLogQueries")
            .WithSummary("Gets the current environment's saved log queries.");

    private static async Task<Ok<SavedLogQueriesResponse>> HandleAsync(
        AppDbContext db, IEnvironmentContext environment, CancellationToken ct)
    {
        var saved = await db.LogSavedQueries
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Environment == environment.Environment, ct);

        return TypedResults.Ok(saved.ToResponse());
    }
}
