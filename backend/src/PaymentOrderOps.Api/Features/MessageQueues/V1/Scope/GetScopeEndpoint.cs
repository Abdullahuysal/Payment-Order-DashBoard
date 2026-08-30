using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Scope;

internal static class GetScopeEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("scope", HandleAsync)
            .WithName("GetMessageQueueScope")
            .WithSummary("Gets the persisted domain scope (name patterns) for the current environment.");

    private static async Task<Ok<QueueScopeResponse>> HandleAsync(
        AppDbContext db, IEnvironmentContext environment, CancellationToken ct)
    {
        var profile = await db.QueueScopeProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Environment == environment.Environment, ct);

        return TypedResults.Ok(profile is null
            ? new QueueScopeResponse([], null)
            : new QueueScopeResponse(profile.Patterns, profile.UpdatedAtUtc));
    }
}
