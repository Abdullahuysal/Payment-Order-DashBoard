using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.ListChecks;

internal static class ListChecksEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet(string.Empty, HandleAsync)
            .WithName("ListServiceHealthChecks")
            .WithSummary("Lists the current environment's service-health check definitions.");

    private static async Task<Ok<IReadOnlyList<ServiceHealthCheckResponse>>> HandleAsync(
        AppDbContext db, IEnvironmentContext environment, CancellationToken ct)
    {
        var entities = await db.ServiceHealthChecks
            .AsNoTracking()
            .Where(x => x.Environment == environment.Environment)
            .OrderBy(x => x.Source)
            .ThenBy(x => x.Name)
            .ToListAsync(ct);

        IReadOnlyList<ServiceHealthCheckResponse> payload = [.. entities.Select(ServiceHealthCheckMapping.ToResponse)];
        return TypedResults.Ok(payload);
    }
}
