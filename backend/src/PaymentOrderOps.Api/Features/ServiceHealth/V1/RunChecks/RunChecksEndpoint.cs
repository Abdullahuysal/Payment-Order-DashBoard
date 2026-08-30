using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.RunChecks;

internal static class RunChecksEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPost("run", HandleAsync)
            .WithName("RunServiceHealthChecks")
            .WithSummary("Runs every check in the current environment and reports each outcome.")
            .WithDescription(
                "Probes the enabled checks with bounded concurrency. Pass `includeDisabled=true` " +
                "to execute the disabled ones too instead of reporting them as `skipped`.");

    private static async Task<Ok<ServiceHealthProbeBatchResponse>> HandleAsync(
        AppDbContext db,
        IEnvironmentContext environment,
        ServiceHealthProbe probe,
        IOptions<ServiceHealthProbeOptions> options,
        CancellationToken ct,
        bool includeDisabled = false)
    {
        var checkedAt = DateTime.UtcNow;

        var entities = await db.ServiceHealthChecks
            .AsNoTracking()
            .Where(x => x.Environment == environment.Environment)
            .OrderBy(x => x.Source)
            .ThenBy(x => x.Name)
            .ToListAsync(ct);

        var results = await ProbeAllAsync(entities, probe, options.Value, includeDisabled, checkedAt, ct);

        return TypedResults.Ok(new ServiceHealthProbeBatchResponse(
            results.Count,
            results.Count(x => x.Status == ServiceHealthProbeStatus.Up),
            results.Count(x => x.Status == ServiceHealthProbeStatus.Down),
            results.Count(x => x.Status == ServiceHealthProbeStatus.Error),
            results.Count(x => x.Status == ServiceHealthProbeStatus.Skipped),
            checkedAt,
            results));
    }

    private static async Task<IReadOnlyList<ServiceHealthProbeResponse>> ProbeAllAsync(
        IReadOnlyList<ServiceHealthCheck> entities,
        ServiceHealthProbe probe,
        ServiceHealthProbeOptions options,
        bool includeDisabled,
        DateTime checkedAt,
        CancellationToken ct)
    {
        using var gate = new SemaphoreSlim(Math.Clamp(options.MaxConcurrency, 1, 32));

        var tasks = entities.Select(async entity =>
        {
            if (!entity.IsEnabled && !includeDisabled)
            {
                return ServiceHealthProbe.Skipped(entity, checkedAt);
            }

            await gate.WaitAsync(ct);
            try
            {
                return await probe.ExecuteAsync(entity, ct);
            }
            finally
            {
                gate.Release();
            }
        });

        return await Task.WhenAll(tasks);
    }
}
