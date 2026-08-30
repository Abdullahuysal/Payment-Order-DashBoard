using System.Text.Json.Nodes;

namespace PaymentOrderOps.Domain.TestRuns;

/// <summary>
/// One executed (or pending) step of a <see cref="TestRun"/>. <see cref="RequestJson"/> and
/// <see cref="ResponseJson"/> are stored already masked by <c>SecretMasker</c>.
/// </summary>
public sealed class TestRunStep
{
    private TestRunStep()
    {
        Key = string.Empty;
        Title = string.Empty;
    }

    public TestRunStep(Guid id, int order, string key, string title, TestStepKind kind)
    {
        Id = id;
        Order = order;
        Key = key;
        Title = title;
        Kind = kind;
        Status = TestRunStepStatus.Pending;
    }

    public Guid Id { get; private set; }

    public Guid TestRunId { get; private set; }

    public int Order { get; private set; }

    public string Key { get; private set; }

    public string Title { get; private set; }

    public TestStepKind Kind { get; private set; }

    public TestRunStepStatus Status { get; private set; }

    public JsonNode? RequestJson { get; private set; }

    public JsonNode? ResponseJson { get; private set; }

    public long? DurationMs { get; private set; }

    public int Attempts { get; private set; }

    public string? Error { get; private set; }

    public DateTime? StartedAtUtc { get; private set; }

    public DateTime? FinishedAtUtc { get; private set; }

    public void Begin(DateTime nowUtc)
    {
        Status = TestRunStepStatus.Running;
        StartedAtUtc = nowUtc;
        Attempts = 0;
    }

    public void Complete(
        TestRunStepStatus status,
        JsonNode? requestJson,
        JsonNode? responseJson,
        long durationMs,
        int attempts,
        string? error,
        DateTime nowUtc)
    {
        Status = status;
        RequestJson = requestJson?.DeepClone();
        ResponseJson = responseJson?.DeepClone();
        DurationMs = durationMs;
        Attempts = attempts;
        Error = string.IsNullOrWhiteSpace(error) ? null : error;
        FinishedAtUtc = nowUtc;
        StartedAtUtc ??= nowUtc;
    }

    public void Skip()
    {
        Status = TestRunStepStatus.Skipped;
    }

    public void MirrorFrom(TestRunStep other)
    {
        Status = other.Status;
        RequestJson = other.RequestJson?.DeepClone();
        ResponseJson = other.ResponseJson?.DeepClone();
        DurationMs = other.DurationMs;
        Attempts = other.Attempts;
        Error = other.Error;
        StartedAtUtc = other.StartedAtUtc;
        FinishedAtUtc = other.FinishedAtUtc;
    }
}
