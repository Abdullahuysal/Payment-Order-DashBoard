using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.GetCheck;

internal static class GetCheckEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("{id:guid}", HandleAsync)
            .WithName("GetServiceHealthCheck")
            .WithSummary("Gets a single service-health check definition scoped to the current environment.");

    private static async Task<Results<Ok<ServiceHealthCheckResponse>, NotFound>> HandleAsync(
        Guid id, AppDbContext db, IEnvironmentContext environment, CancellationToken ct)
    {
        var entity = await db.ServiceHealthChecks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.Environment == environment.Environment, ct);

        return entity is null ? TypedResults.NotFound() : TypedResults.Ok(entity.ToResponse());
    }
}
