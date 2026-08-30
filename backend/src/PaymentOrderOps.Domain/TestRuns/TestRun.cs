using System.Text.Json.Nodes;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Domain.TestRuns;

/// <summary>
/// One execution of a <see cref="TestScenario"/> in a single environment. A bulk run is a
/// parent with <see cref="RepeatCount"/> children (each with <see cref="ParentRunId"/> set);
/// the parent carries the aggregate <see cref="Summary"/>.
/// </summary>
public sealed class TestRun
{
    private readonly List<TestRunStep> _steps = [];

    private TestRun()
    {
        ScenarioKey = string.Empty;
        TriggeredBy = "anonymous";
        RunParams = new Dictionary<string, JsonNode?>(StringComparer.Ordinal);
        Variables = new Dictionary<string, JsonNode?>(StringComparer.Ordinal);
    }

    public TestRun(
        Guid id,
        Guid scenarioId,
        string scenarioKey,
        Guid? profileId,
        ServiceEnvironment environment,
        string triggeredBy,
        IEnumerable<KeyValuePair<string, JsonNode?>>? runParams,
        Guid? parentRunId,
        int? repeatCount,
        int? repeatConcurrency,
        IEnumerable<TestRunStep> steps)
    {
        Id = id;
        ScenarioId = scenarioId;
        ScenarioKey = scenarioKey;
        ProfileId = profileId;
        Environment = environment;
        TriggeredBy = string.IsNullOrWhiteSpace(triggeredBy) ? "anonymous" : triggeredBy.Trim();
        Status = TestRunStatus.Queued;
        RunParams = Clone(runParams);
        Variables = new Dictionary<string, JsonNode?>(StringComparer.Ordinal);
        ParentRunId = parentRunId;
        RepeatCount = repeatCount;
        RepeatConcurrency = repeatConcurrency;
        _steps.AddRange(steps);
    }

    public Guid Id { get; private set; }

    public Guid ScenarioId { get; private set; }

    public string ScenarioKey { get; private set; }

    public Guid? ProfileId { get; private set; }

    public ServiceEnvironment Environment { get; private set; }

    public TestRunStatus Status { get; private set; }

    public string TriggeredBy { get; private set; }

    public Dictionary<string, JsonNode?> RunParams { get; private set; }

    public Dictionary<string, JsonNode?> Variables { get; private set; }

    public BulkRunSummary? Summary { get; private set; }

    public Guid? ParentRunId { get; private set; }

    public int? RepeatCount { get; private set; }

    public int? RepeatConcurrency { get; private set; }

    public DateTime? StartedAtUtc { get; private set; }

    public DateTime? FinishedAtUtc { get; private set; }

    public string? Error { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public IReadOnlyList<TestRunStep> Steps => _steps;

    public bool IsBulkParent => RepeatCount is > 0 && ParentRunId is null;

    public bool IsTerminal => Status is TestRunStatus.Passed or TestRunStatus.Failed or TestRunStatus.Cancelled;

    public void Begin(DateTime nowUtc)
    {
        Status = TestRunStatus.Running;
        StartedAtUtc ??= nowUtc;
    }

    public void Complete(TestRunStatus terminal, string? error, DateTime nowUtc)
    {
        Status = terminal;
        Error = string.IsNullOrWhiteSpace(error) ? null : error;
        FinishedAtUtc = nowUtc;
        StartedAtUtc ??= nowUtc;
    }

    public void ReplaceVariables(IEnumerable<KeyValuePair<string, JsonNode?>> variables)
    {
        Variables = Clone(variables);
    }

    public void PutVariable(string key, JsonNode? value)
    {
        if (!string.IsNullOrWhiteSpace(key))
        {
            Variables[key] = value?.DeepClone();
        }
    }

    public void SetSummary(BulkRunSummary summary)
    {
        Summary = summary;
    }

    private static Dictionary<string, JsonNode?> Clone(IEnumerable<KeyValuePair<string, JsonNode?>>? source)
    {
        var map = new Dictionary<string, JsonNode?>(StringComparer.Ordinal);
        if (source is null)
        {
            return map;
        }

        foreach (var (key, value) in source)
        {
            if (!string.IsNullOrWhiteSpace(key))
            {
                map[key] = value?.DeepClone();
            }
        }

        return map;
    }
}
