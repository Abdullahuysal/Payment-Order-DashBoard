using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

internal static class TestRunsMapping
{
    public static ScenarioResponse ToResponse(this TestScenario scenario) => new(
        scenario.Id,
        scenario.Key,
        scenario.Name,
        scenario.Description,
        scenario.Kind,
        [.. scenario.Inputs.Select(ToResponse)]);

    public static ScenarioDetailResponse ToDetail(this TestScenario scenario, TestRunsOptions limits) => new(
        scenario.Id,
        scenario.Key,
        scenario.Name,
        scenario.Description,
        scenario.Kind,
        [.. scenario.Inputs.Select(ToResponse)],
        [.. scenario.Steps.Select(step => new StepViewResponse(step.Key, step.Title, step.Kind))],
        scenario.SupportsRepeat
            ? new BulkLimitsResponse(limits.MaxBulkCount, limits.MaxBulkConcurrency)
            : null);

    public static InputFieldResponse ToResponse(this InputField field) => new(
        field.Name,
        field.Label,
        field.Type,
        field.Required,
        field.Options is null ? null : [.. field.Options.Select(o => new InputOptionResponse(o.Value, o.Label))],
        field.Placeholder,
        field.Help,
        field.DefaultValue?.DeepClone());

    public static ProfileResponse ToResponse(this ScenarioProfile profile) => new(
        profile.Id,
        profile.ScenarioId,
        profile.Name,
        profile.Environment,
        profile.Values.ToDictionary(kv => kv.Key, kv => kv.Value?.DeepClone()),
        profile.UpdatedAtUtc,
        profile.Xmin.ToString(System.Globalization.CultureInfo.InvariantCulture));

    public static RunStepViewResponse ToResponse(this TestRunStep step) => new(
        step.Key,
        step.Title,
        step.Kind,
        step.Status,
        step.StartedAtUtc,
        step.FinishedAtUtc,
        step.DurationMs,
        step.Attempts,
        step.RequestJson?.DeepClone(),
        step.ResponseJson?.DeepClone(),
        step.Error);

    public static BulkSummaryResponse ToResponse(this BulkRunSummary summary) => new(
        summary.Total,
        summary.Passed,
        summary.Failed,
        new DurationSpreadResponse(summary.DurationMs.Min, summary.DurationMs.Median, summary.DurationMs.Max),
        [.. summary.OrderNos]);

    public static RunResponse ToResponse(
        this TestRun run,
        string scenarioName,
        TestScenarioKind kind,
        string? profileName,
        IReadOnlyList<RunIterationResponse>? iterations) => new(
        run.Id,
        run.ScenarioId,
        run.ScenarioKey,
        scenarioName,
        kind,
        run.ProfileId,
        profileName,
        run.Environment,
        run.Status,
        run.StartedAtUtc ?? run.CreatedAtUtc,
        run.FinishedAtUtc,
        run.TriggeredBy,
        run.RunParams.ToDictionary(kv => kv.Key, kv => kv.Value?.DeepClone()),
        run.Variables.ToDictionary(kv => kv.Key, kv => kv.Value?.DeepClone()),
        [.. run.Steps.OrderBy(s => s.Order).Select(ToResponse)],
        ToRepeat(run),
        iterations is { Count: > 0 } ? iterations : null,
        run.Summary?.ToResponse(),
        run.Error);

    public static RunSummaryResponse ToSummary(
        this TestRun run, string scenarioName, TestScenarioKind kind, string? profileName) => new(
        run.Id,
        run.ScenarioId,
        run.ScenarioKey,
        scenarioName,
        kind,
        run.ProfileId,
        profileName,
        run.Environment,
        run.Status,
        run.StartedAtUtc ?? run.CreatedAtUtc,
        run.FinishedAtUtc,
        Duration(run),
        run.TriggeredBy,
        ToRepeat(run));

    public static RunIterationResponse ToIteration(this TestRun child, int index)
    {
        child.Variables.TryGetValue("orderNo", out var orderNo);
        return new RunIterationResponse(
            index,
            child.Status,
            child.Id,
            Duration(child),
            orderNo?.ToString(),
            child.Error);
    }

    private static RepeatConfigResponse? ToRepeat(TestRun run) =>
        run is { RepeatCount: { } count, RepeatConcurrency: { } concurrency }
            ? new RepeatConfigResponse(count, concurrency)
            : null;

    private static long? Duration(TestRun run) =>
        run.FinishedAtUtc is { } finished
            ? (long)(finished - (run.StartedAtUtc ?? run.CreatedAtUtc)).TotalMilliseconds
            : null;
}
