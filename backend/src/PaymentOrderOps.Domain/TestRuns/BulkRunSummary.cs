namespace PaymentOrderOps.Domain.TestRuns;

/// <summary>
/// Roll-up a bulk (parent) run persists once its children finish. Field names mirror the
/// frontend <c>RunResultSummary</c> contract (<c>total</c> / <c>passed</c> / <c>orderNos</c>).
/// </summary>
public sealed record BulkRunSummary
{
    public int Total { get; init; }

    public int Passed { get; init; }

    public int Failed { get; init; }

    public required DurationSpread DurationMs { get; init; }

    public IReadOnlyList<string> OrderNos { get; init; } = [];
}

public sealed record DurationSpread(long Min, long Median, long Max);
