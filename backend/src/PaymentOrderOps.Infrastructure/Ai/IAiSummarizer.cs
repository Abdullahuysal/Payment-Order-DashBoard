using PaymentOrderOps.Infrastructure.Logs;

namespace PaymentOrderOps.Infrastructure.Ai;

/// <summary>
/// Turns a set of <see cref="ExceptionGroup"/> observations over a time window into a short
/// operator-facing summary. Stateless: the connection is passed per call. A blank API key
/// throws <see cref="AiNotConfiguredException"/> (→ 503); a failed call throws
/// <see cref="AiUnreachableException"/> (→ 502).
/// </summary>
public interface IAiSummarizer
{
    Task<AiLogSummary> SummarizeAsync(
        AnthropicConnection connection,
        IReadOnlyList<ExceptionGroup> groups,
        DateTimeOffset windowStart,
        DateTimeOffset windowEnd,
        CancellationToken ct);
}
