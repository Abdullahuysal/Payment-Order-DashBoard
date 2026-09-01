using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;

namespace PaymentOrderOps.Api.Features.Logs.V1.Shared;

public sealed record LogEntryResponse(
    string Id,
    DateTimeOffset? Timestamp,
    string? Level,
    string? Message,
    string? Service,
    string? TraceId,
    string? SpanId,
    string? Logger,
    string? Host,
    string? ExceptionType,
    string? ExceptionMessage,
    string? ExceptionStackTrace,
    IReadOnlyDictionary<string, string> Fields);

public sealed record LogFacetBucket(string Key, long Count);

public sealed record LogFacets(
    IReadOnlyList<LogFacetBucket> Levels,
    IReadOnlyList<LogFacetBucket> Services);

public sealed record LogSearchResponse(
    PagedResponse<LogEntryResponse> Page,
    LogFacets Facets);

public sealed record ExceptionGroupResponse(
    string Fingerprint,
    string ExceptionType,
    string SampleMessage,
    string? TopFrame,
    long Count,
    DateTimeOffset? FirstSeen,
    DateTimeOffset? LastSeen,
    IReadOnlyList<string> Services);

public sealed record AiSummaryGroupResponse(
    int Index,
    string RootCauseGuess,
    string Impact,
    string SuggestedAction,
    string Confidence);

public sealed record AiSummaryResponse(
    string Headline,
    IReadOnlyList<AiSummaryGroupResponse> Groups,
    IReadOnlyList<ExceptionGroupResponse> ExceptionGroups,
    DateTimeOffset WindowStart,
    DateTimeOffset WindowEnd,
    string Model,
    bool Cached,
    DateTimeOffset GeneratedAt);

public sealed record SavedLogQueryResponse(
    string Name,
    string? Text,
    string? Level,
    string? Service,
    string? TraceId);

public sealed record SavedLogQueriesResponse(
    IReadOnlyList<SavedLogQueryResponse> Queries,
    DateTimeOffset? UpdatedAt);
