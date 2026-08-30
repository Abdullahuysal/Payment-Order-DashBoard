using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.RunCheck;

internal static class RunCheckEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPost("{id:guid}/run", HandleAsync)
            .WithName("RunServiceHealthCheck")
            .WithSummary("Sends the stored request and compares the response status with the expected one.")
            .WithDescription(
                "Executes the check exactly as defined (method, url, headers, body) and returns " +
                "`up` only when the service answers with the configured expected status code. " +
                "A disabled check still runs when it is requested explicitly.");

    private static async Task<Results<Ok<ServiceHealthProbeResponse>, NotFound>> HandleAsync(
        Guid id,
        AppDbContext db,
        IEnvironmentContext environment,
        ServiceHealthProbe probe,
        CancellationToken ct)
    {
        var entity = await db.ServiceHealthChecks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.Environment == environment.Environment, ct);

        if (entity is null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(await probe.ExecuteAsync(entity, ct));
    }
}
