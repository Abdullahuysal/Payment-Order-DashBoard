namespace PaymentOrderOps.Infrastructure.Logs;

/// <summary>A single normalized log document, field names resolved through <see cref="LogFieldMap"/>.</summary>
public sealed record LogEntry(
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

/// <summary>Filters for a paged log search. All members are optional except paging.</summary>
public sealed record LogSearchQuery(
    string? Text,
    string? Level,
    string? Service,
    string? TraceId,
    DateTimeOffset? From,
    DateTimeOffset? To,
    int Page,
    int PageSize);

/// <summary>One page of hits plus the whole-result term counts used to render facets.</summary>
public sealed record LogSearchResult(
    IReadOnlyList<LogEntry> Entries,
    long TotalCount,
    IReadOnlyDictionary<string, long> LevelCounts,
    IReadOnlyDictionary<string, long> ServiceCounts);

/// <summary>
/// A cluster of exceptions sharing a <see cref="Fingerprint"/> over a time window
/// (<c>sha1(type + normalizedMessage + topFrame)</c>).
/// </summary>
public sealed record ExceptionGroup(
    string Fingerprint,
    string ExceptionType,
    string SampleMessage,
    string? TopFrame,
    long Count,
    DateTimeOffset? FirstSeen,
    DateTimeOffset? LastSeen,
    IReadOnlyList<string> Services);
