using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Domain.Logs;
using PaymentOrderOps.Infrastructure.Ai;
using PaymentOrderOps.Infrastructure.Logs;

namespace PaymentOrderOps.Api.Features.Logs.V1.Shared;

internal static class LogsMapping
{
    public static LogEntryResponse ToResponse(this LogEntry entry) => new(
        entry.Id,
        entry.Timestamp,
        entry.Level,
        entry.Message,
        entry.Service,
        entry.TraceId,
        entry.SpanId,
        entry.Logger,
        entry.Host,
        entry.ExceptionType,
        entry.ExceptionMessage,
        entry.ExceptionStackTrace,
        entry.Fields);

    public static LogSearchResponse ToResponse(this LogSearchResult result, int page, int pageSize)
    {
        var totalPages = result.TotalCount == 0
            ? 0
            : (int)Math.Ceiling(result.TotalCount / (double)pageSize);

        IReadOnlyList<LogEntryResponse> items = [.. result.Entries.Select(e => e.ToResponse())];
        var paged = new PagedResponse<LogEntryResponse>(items, page, pageSize, (int)result.TotalCount, totalPages);

        return new LogSearchResponse(paged, result.ToFacets());
    }

    public static LogFacets ToFacets(this LogSearchResult result) => new(
        [.. result.LevelCounts.OrderByDescending(kv => kv.Value).Select(kv => new LogFacetBucket(kv.Key, kv.Value))],
        [.. result.ServiceCounts.OrderByDescending(kv => kv.Value).Select(kv => new LogFacetBucket(kv.Key, kv.Value))]);

    public static ExceptionGroupResponse ToResponse(this ExceptionGroup group) => new(
        group.Fingerprint,
        group.ExceptionType,
        group.SampleMessage,
        group.TopFrame,
        group.Count,
        group.FirstSeen,
        group.LastSeen,
        group.Services);

    public static AiSummaryResponse ToResponse(
        this AiLogSummary summary,
        IReadOnlyList<ExceptionGroup> exceptionGroups,
        DateTimeOffset windowStart,
        DateTimeOffset windowEnd,
        string model,
        bool cached,
        DateTimeOffset generatedAt) => new(
        summary.Headline,
        [.. summary.Groups.Select(g => new AiSummaryGroupResponse(g.Index, g.RootCauseGuess, g.Impact, g.SuggestedAction, g.Confidence))],
        [.. exceptionGroups.Select(g => g.ToResponse())],
        windowStart,
        windowEnd,
        model,
        cached,
        generatedAt);

    public static SavedLogQueriesResponse ToResponse(this LogSavedQuery? saved) => saved is null
        ? new SavedLogQueriesResponse([], null)
        : new SavedLogQueriesResponse(
            [.. saved.Queries.Select(q => new SavedLogQueryResponse(q.Name, q.Text, q.Level, q.Service, q.TraceId))],
            saved.UpdatedAtUtc);
}
