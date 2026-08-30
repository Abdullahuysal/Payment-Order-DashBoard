using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>
/// Single background consumer of <see cref="TestRunQueue"/>. Per run it opens a DI scope, sets
/// the ambient environment, registers a cancellation source, and hands off to
/// <see cref="ScenarioRunner"/>. Runs are processed one at a time (bulk fan-out is internal).
/// </summary>
public sealed class TestRunWorker(
    TestRunQueue queue,
    TestRunCancellationRegistry registry,
    IServiceScopeFactory scopeFactory,
    ILogger<TestRunWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var runId in queue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                await ProcessAsync(runId, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Test run {RunId} threw out of the worker loop", runId);
            }
        }
    }

    private async Task ProcessAsync(Guid runId, CancellationToken stoppingToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var environment = await db.TestRuns
            .Where(r => r.Id == runId)
            .Select(r => (ServiceEnvironment?)r.Environment)
            .FirstOrDefaultAsync(stoppingToken);

        if (environment is null)
        {
            return;
        }

        scope.ServiceProvider.GetRequiredService<EnvironmentContextHolder>().Set(environment.Value);

        using var cts = registry.Register(runId, stoppingToken);
        try
        {
            var runner = scope.ServiceProvider.GetRequiredService<ScenarioRunner>();
            await runner.RunAsync(runId, cts.Token);
        }
        finally
        {
            registry.Release(runId);
        }
    }
}
