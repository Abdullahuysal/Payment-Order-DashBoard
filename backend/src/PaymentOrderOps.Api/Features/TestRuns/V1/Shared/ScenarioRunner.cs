using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;
using PaymentOrderOps.Infrastructure.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>
/// Executes one queued run: merges the profile and run params into a variable bag, runs each
/// step in order via <see cref="StepExecutor"/>, persists a masked <see cref="TestRunStep"/>
/// and streams an event per transition. A failed step skips the rest and fails the run; a bulk
/// parent fans out to N child runs and rolls up their summary.
/// </summary>
public sealed class ScenarioRunner(
    AppDbContext db,
    StepExecutor stepExecutor,
    TestRunTargetResolver resolver,
    ITestRunEventBus events,
    IServiceScopeFactory scopeFactory,
    TimeProvider clock,
    ILogger<ScenarioRunner> logger)
{
    public async Task RunAsync(Guid runId, CancellationToken ct)
    {
        var run = await db.TestRuns
            .Include(r => r.Steps)
            .FirstOrDefaultAsync(r => r.Id == runId, ct);

        if (run is null || run.IsTerminal)
        {
            return;
        }

        var scenario = await db.TestScenarios.AsNoTracking().FirstOrDefaultAsync(s => s.Id == run.ScenarioId, ct);
        if (scenario is null)
        {
            await FinalizeAsync(run, TestRunStatus.Failed, "The scenario no longer exists.", streamTo: run.Id);
            return;
        }

        try
        {
            if (run.IsBulkParent)
            {
                await RunBulkAsync(run, scenario, ct);
            }
            else
            {
                await RunSingleAsync(run, scenario, BuildMasker(), streamTo: run.Id, ct);
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            await CancelAsync(run);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Run {RunId} failed unexpectedly", runId);
            await FinalizeAsync(run, TestRunStatus.Failed, ex.Message, streamTo: run.Id);
        }
    }

    private async Task RunChildAsync(Guid childId, CancellationToken ct)
    {
        var child = await db.TestRuns.Include(r => r.Steps).FirstOrDefaultAsync(r => r.Id == childId, ct);
        if (child is null || child.IsTerminal)
        {
            return;
        }

        var scenario = await db.TestScenarios.AsNoTracking().FirstOrDefaultAsync(s => s.Id == child.ScenarioId, ct);
        if (scenario is null)
        {
            await FinalizeAsync(child, TestRunStatus.Failed, "The scenario no longer exists.", streamTo: null);
            return;
        }

        try
        {
            await RunSingleAsync(child, scenario, BuildMasker(), streamTo: null, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            await CancelAsync(child);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Child run {RunId} failed unexpectedly", childId);
            await FinalizeAsync(child, TestRunStatus.Failed, ex.Message, streamTo: null);
        }
    }

    private async Task RunSingleAsync(
        TestRun run, TestScenario scenario, SecretMasker masker, Guid? streamTo, CancellationToken ct)
    {
        run.Begin(clock.GetUtcNow().UtcDateTime);
        await db.SaveChangesAsync(ct);

        var bag = BuildVariableBag(run, scenario);
        var priorOutputs = new Dictionary<string, PriorStepOutput>(StringComparer.Ordinal);
        var orderedSteps = run.Steps.OrderBy(s => s.Order).ToList();
        var correlationId = $"testrun-{run.Id:N}";

        for (var i = 0; i < orderedSteps.Count && i < scenario.Steps.Count; i++)
        {
            ct.ThrowIfCancellationRequested();

            var stepRow = orderedSteps[i];
            var definition = scenario.Steps[i];
            var startedAt = clock.GetUtcNow().UtcDateTime;

            stepRow.Begin(startedAt);
            await db.SaveChangesAsync(ct);
            await PublishAsync(streamTo, new StepStartedEvent(stepRow.Key, startedAt));

            var context = new StepRunContext
            {
                EnvironmentName = resolver.EnvironmentName,
                Variables = bag,
                PriorOutputs = priorOutputs,
                CorrelationId = correlationId,
            };

            StepExecutionResult result;
            try
            {
                result = await stepExecutor.ExecuteAsync(definition, context, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                result = new StepExecutionResult { Status = TestRunStepStatus.Failed, Error = ex.Message };
            }

            masker = masker.With([.. result.ResolvedSecrets]);
            foreach (var (key, value) in result.Extracted)
            {
                bag[key] = value?.DeepClone();
                run.PutVariable(key, value);
            }

            priorOutputs[stepRow.Key] = new PriorStepOutput(definition.Kind, result.ResponseJson, result.Xml);

            var finishedAt = clock.GetUtcNow().UtcDateTime;
            var durationMs = (long)(finishedAt - startedAt).TotalMilliseconds;
            stepRow.Complete(
                result.Status,
                masker.Redact(result.RequestJson),
                masker.Redact(result.ResponseJson),
                durationMs,
                result.Attempts,
                masker.MaskText(result.Error),
                finishedAt);
            await db.SaveChangesAsync(ct);

            await PublishAsync(streamTo, new StepFinishedEvent(
                stepRow.Key, result.Status, finishedAt, durationMs, result.Attempts, masker.MaskText(result.Error)));

            if (result.Status == TestRunStepStatus.Failed)
            {
                foreach (var skipped in orderedSteps.Skip(i + 1))
                {
                    skipped.Skip();
                }

                await FinalizeAsync(run, TestRunStatus.Failed, masker.MaskText(result.Error), streamTo);
                return;
            }
        }

        await FinalizeAsync(run, TestRunStatus.Passed, error: null, streamTo);
    }

    private async Task RunBulkAsync(TestRun parent, TestScenario scenario, CancellationToken ct)
    {
        parent.Begin(clock.GetUtcNow().UtcDateTime);
        await db.SaveChangesAsync(ct);

        var count = Math.Max(1, parent.RepeatCount ?? 1);
        var concurrency = Math.Clamp(parent.RepeatConcurrency ?? 1, 1, count);

        var childIds = new List<Guid>(count);
        for (var i = 0; i < count; i++)
        {
            var child = new TestRun(
                Guid.CreateVersion7(),
                parent.ScenarioId,
                parent.ScenarioKey,
                parent.ProfileId,
                parent.Environment,
                parent.TriggeredBy,
                parent.RunParams,
                parentRunId: parent.Id,
                repeatCount: null,
                repeatConcurrency: null,
                TestRunFactory.PendingSteps(scenario));
            db.TestRuns.Add(child);
            childIds.Add(child.Id);
        }

        await db.SaveChangesAsync(ct);

        var cancelled = false;
        try
        {
            await Parallel.ForEachAsync(childIds, new ParallelOptions
            {
                MaxDegreeOfParallelism = concurrency,
                CancellationToken = ct,
            }, async (childId, token) =>
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                scope.ServiceProvider.GetRequiredService<EnvironmentContextHolder>().Set(parent.Environment);
                var runner = scope.ServiceProvider.GetRequiredService<ScenarioRunner>();
                await runner.RunChildAsync(childId, token);
            });
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            cancelled = true;
        }

        await using var readScope = scopeFactory.CreateAsyncScope();
        var readDb = readScope.ServiceProvider.GetRequiredService<AppDbContext>();

        var stuck = await readDb.TestRuns
            .Include(r => r.Steps)
            .Where(r => r.ParentRunId == parent.Id && (r.Status == TestRunStatus.Queued || r.Status == TestRunStatus.Running))
            .ToListAsync(CancellationToken.None);
        foreach (var child in stuck)
        {
            foreach (var step in child.Steps.Where(s => s.Status is TestRunStepStatus.Pending or TestRunStepStatus.Running))
            {
                step.Skip();
            }

            child.Complete(TestRunStatus.Cancelled, "cancelled", clock.GetUtcNow().UtcDateTime);
        }

        if (stuck.Count > 0)
        {
            await readDb.SaveChangesAsync(CancellationToken.None);
        }

        var children = await readDb.TestRuns
            .AsNoTracking()
            .Include(r => r.Steps)
            .Where(r => r.ParentRunId == parent.Id)
            .OrderBy(r => r.CreatedAtUtc)
            .ToListAsync(CancellationToken.None);

        var durations = children.Select(RunDuration).Where(d => d.HasValue).Select(d => d!.Value).ToList();
        var orderNos = children
            .Select(c => c.Variables.TryGetValue("orderNo", out var value) ? value?.ToString() : null)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!)
            .ToList();

        var summary = new BulkRunSummary
        {
            Total = count,
            Passed = children.Count(c => c.Status == TestRunStatus.Passed),
            Failed = children.Count(c => c.Status == TestRunStatus.Failed),
            DurationMs = Spread(durations),
            OrderNos = orderNos,
        };

        parent.SetSummary(summary);
        parent.PutVariable("orderNos", new JsonArray([.. orderNos.Select(o => JsonValue.Create(o))]));
        MirrorRepresentativeSteps(parent, children);

        var status = cancelled || children.Any(c => c.Status == TestRunStatus.Cancelled)
            ? TestRunStatus.Cancelled
            : children.Any(c => c.Status == TestRunStatus.Failed)
                ? TestRunStatus.Failed
                : TestRunStatus.Passed;

        await FinalizeAsync(parent, status, status == TestRunStatus.Failed ? "one or more iterations failed" : null,
            streamTo: parent.Id, summary.ToResponse());
    }

    private async Task CancelAsync(TestRun run)
    {
        foreach (var step in run.Steps.Where(s => s.Status is TestRunStepStatus.Pending or TestRunStepStatus.Running))
        {
            step.Skip();
        }

        await FinalizeAsync(run, TestRunStatus.Cancelled, "cancelled", streamTo: run.Id);
    }

    private async Task FinalizeAsync(
        TestRun run, TestRunStatus status, string? error, Guid? streamTo, BulkSummaryResponse? summary = null)
    {
        if (!run.IsTerminal)
        {
            run.Complete(status, error, clock.GetUtcNow().UtcDateTime);
        }

        await db.SaveChangesAsync(CancellationToken.None);
        await PublishAsync(streamTo, new RunFinishedEvent(run.Status, run.FinishedAtUtc ?? clock.GetUtcNow().UtcDateTime, summary));

        if (streamTo is { } id)
        {
            events.Complete(id);
        }
    }

    private async Task PublishAsync(Guid? streamTo, RunEvent runEvent)
    {
        if (streamTo is { } id)
        {
            await events.PublishAsync(id, runEvent);
        }
    }

    private SecretMasker BuildMasker() =>
        new(resolver.ConfiguredAuthHeaderNames(), resolver.ConfiguredStaticSecrets());

    private Dictionary<string, JsonNode?> BuildVariableBag(TestRun run, TestScenario scenario)
    {
        var bag = new Dictionary<string, JsonNode?>(StringComparer.Ordinal);

        if (run.ProfileId is { } profileId)
        {
            var profile = db.ScenarioProfiles.AsNoTracking().FirstOrDefault(p => p.Id == profileId);
            foreach (var (key, value) in profile?.Values ?? [])
            {
                bag[key] = value?.DeepClone();
            }
        }

        foreach (var (key, value) in run.RunParams)
        {
            bag[key] = value?.DeepClone();
        }

        foreach (var field in scenario.Inputs)
        {
            if (!bag.ContainsKey(field.Name) && field.DefaultValue is not null)
            {
                bag[field.Name] = field.DefaultValue.DeepClone();
            }
        }

        return bag;
    }

    private static void MirrorRepresentativeSteps(TestRun parent, IReadOnlyList<TestRun> children)
    {
        var representative = children.FirstOrDefault(c => c.Status == TestRunStatus.Passed) ?? children.FirstOrDefault();
        if (representative is null)
        {
            return;
        }

        var byOrder = representative.Steps.ToDictionary(s => s.Order);
        foreach (var step in parent.Steps)
        {
            if (byOrder.TryGetValue(step.Order, out var source))
            {
                step.MirrorFrom(source);
            }
        }
    }

    private static long? RunDuration(TestRun run) =>
        run.FinishedAtUtc is { } finished
            ? (long)(finished - (run.StartedAtUtc ?? run.CreatedAtUtc)).TotalMilliseconds
            : null;

    private static DurationSpread Spread(IReadOnlyList<long> values)
    {
        if (values.Count == 0)
        {
            return new DurationSpread(0, 0, 0);
        }

        var sorted = values.OrderBy(v => v).ToArray();
        var mid = sorted.Length / 2;
        var median = sorted.Length % 2 == 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        return new DurationSpread(sorted[0], median, sorted[^1]);
    }
}
