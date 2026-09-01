using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.Logs;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Infrastructure.Ai;
using PaymentOrderOps.Infrastructure.Logs;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Logs.V1.Shared;

/// <summary>
/// Once a day at 18:05 UTC, builds and stores an AI exception digest for every environment
/// whose Elasticsearch and Anthropic blocks are configured. Runs are best-effort: an
/// unconfigured or unreachable environment is logged and skipped, never fatal.
/// </summary>
public sealed class LogAiSummaryWorker(IServiceScopeFactory scopeFactory, TimeProvider clock, ILogger<LogAiSummaryWorker> logger)
    : BackgroundService
{
    private static readonly TimeSpan RunAt = new(18, 5, 0);
    private static readonly JsonSerializerOptions PayloadJson = new(JsonSerializerDefaults.Web);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(DelayUntilNextRun(), clock, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            foreach (var environment in Enum.GetValues<ServiceEnvironment>())
            {
                try
                {
                    await RunForEnvironmentAsync(environment, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex) when (ex is LogSearchNotConfiguredException or AiNotConfiguredException)
                {
                    logger.LogDebug("Skipping daily AI log digest for {Environment}: not configured", environment);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Daily AI log digest failed for {Environment}", environment);
                }
            }
        }
    }

    private TimeSpan DelayUntilNextRun()
    {
        var now = clock.GetUtcNow();
        var todayRun = new DateTimeOffset(now.Year, now.Month, now.Day, RunAt.Hours, RunAt.Minutes, 0, TimeSpan.Zero);
        var next = now < todayRun ? todayRun : todayRun.AddDays(1);
        return next - now;
    }

    private async Task RunForEnvironmentAsync(ServiceEnvironment environment, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var services = scope.ServiceProvider;
        services.GetRequiredService<EnvironmentContextHolder>().Set(environment);

        var resolver = services.GetRequiredService<LogSearchResolver>();
        var elasticsearch = resolver.RequireElasticsearch();
        var connection = resolver.RequireAi();

        var windowEnd = clock.GetUtcNow();
        var windowStart = windowEnd - TimeSpan.FromHours(24);

        var logs = services.GetRequiredService<ILogSearchGateway>();
        var groups = await logs.ListExceptionsAsync(elasticsearch, windowStart, windowEnd, service: null, ct);
        if (groups.Count == 0)
        {
            return;
        }

        var summarizer = services.GetRequiredService<IAiSummarizer>();
        var summary = await summarizer.SummarizeAsync(connection, groups, windowStart, windowEnd, ct);

        var response = summary.ToResponse(
            groups, windowStart, windowEnd, connection.Options.Model, cached: false, generatedAt: clock.GetUtcNow());
        var payload = JsonSerializer.Serialize(response, PayloadJson);

        var db = services.GetRequiredService<AppDbContext>();
        var start = windowStart.UtcDateTime;
        var end = windowEnd.UtcDateTime;
        var filtersHash = LogFiltersHash.Compute(null, null, null, null);

        var entity = await db.LogAiSummaries.FirstOrDefaultAsync(
            s => s.Environment == environment && s.WindowStartUtc == start && s.WindowEndUtc == end && s.FiltersHash == filtersHash,
            ct);

        if (entity is null)
        {
            db.LogAiSummaries.Add(new LogAiSummary(
                environment, start, end, filtersHash, payload, connection.Options.Model, groups.Count));
        }
        else
        {
            entity.Refresh(payload, connection.Options.Model, groups.Count);
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Stored daily AI log digest for {Environment} ({GroupCount} groups)", environment, groups.Count);
    }
}
