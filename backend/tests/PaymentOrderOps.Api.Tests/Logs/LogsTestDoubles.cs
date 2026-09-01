using PaymentOrderOps.Infrastructure.Ai;
using PaymentOrderOps.Infrastructure.Logs;

namespace PaymentOrderOps.Api.Tests.Logs;

public sealed class FakeLogSearchGateway : ILogSearchGateway
{
    public int SearchCalls { get; private set; }

    public int ExceptionCalls { get; private set; }

    public LogSearchResult NextSearchResult { get; set; } = new(
        [],
        0,
        new Dictionary<string, long>(),
        new Dictionary<string, long>());

    public LogEntry? NextEntry { get; set; }

    public IReadOnlyList<ExceptionGroup> NextExceptionGroups { get; set; } = [];

    public Task<LogSearchResult> SearchAsync(ElasticsearchOptions options, LogSearchQuery query, CancellationToken ct)
    {
        SearchCalls++;
        return Task.FromResult(NextSearchResult);
    }

    public Task<LogEntry?> GetByIdAsync(ElasticsearchOptions options, string id, CancellationToken ct) =>
        Task.FromResult(NextEntry);

    public Task<IReadOnlyList<ExceptionGroup>> ListExceptionsAsync(
        ElasticsearchOptions options, DateTimeOffset from, DateTimeOffset to, string? service, CancellationToken ct)
    {
        ExceptionCalls++;
        return Task.FromResult(NextExceptionGroups);
    }
}

public sealed class FakeAiSummarizer : IAiSummarizer
{
    public int CallCount { get; private set; }

    public AiLogSummary NextSummary { get; set; } = new(
        "fake headline",
        [new AiLogSummaryGroup(0, "fake root cause", "fake impact", "fake action", "low")]);

    public Task<AiLogSummary> SummarizeAsync(
        AnthropicConnection connection,
        IReadOnlyList<ExceptionGroup> groups,
        DateTimeOffset windowStart,
        DateTimeOffset windowEnd,
        CancellationToken ct)
    {
        CallCount++;
        return Task.FromResult(NextSummary);
    }
}
