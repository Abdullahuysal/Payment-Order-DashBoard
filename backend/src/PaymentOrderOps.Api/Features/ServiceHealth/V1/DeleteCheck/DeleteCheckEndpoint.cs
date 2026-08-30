using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.DeleteCheck;

internal static class DeleteCheckEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapDelete("{id:guid}", HandleAsync)
            .WithName("DeleteServiceHealthCheck")
            .WithSummary("Soft-deletes a service-health check definition in the current environment.");

    private static async Task<Results<NoContent, NotFound>> HandleAsync(
        Guid id, AppDbContext db, IEnvironmentContext environment, CancellationToken ct)
    {
        var entity = await db.ServiceHealthChecks
            .FirstOrDefaultAsync(x => x.Id == id && x.Environment == environment.Environment, ct);
        if (entity is null)
        {
            return TypedResults.NotFound();
        }

        entity.SoftDelete();
        await db.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }
}
