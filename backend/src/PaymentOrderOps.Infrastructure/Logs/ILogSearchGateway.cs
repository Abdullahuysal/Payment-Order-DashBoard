namespace PaymentOrderOps.Infrastructure.Logs;

/// <summary>
/// Stateless Elasticsearch reader. Every method takes the connection
/// <see cref="ElasticsearchOptions"/> per call (the API-side resolver picks the block for
/// <c>X-Environment</c>). A transport failure throws <see cref="LogSearchUnreachableException"/>
/// (→ 502); "not configured" is decided before the gateway is reached
/// (<see cref="LogSearchNotConfiguredException"/> → 503).
/// </summary>
public interface ILogSearchGateway
{
    Task<LogSearchResult> SearchAsync(ElasticsearchOptions options, LogSearchQuery query, CancellationToken ct);

    Task<LogEntry?> GetByIdAsync(ElasticsearchOptions options, string id, CancellationToken ct);

    Task<IReadOnlyList<ExceptionGroup>> ListExceptionsAsync(
        ElasticsearchOptions options, DateTimeOffset from, DateTimeOffset to, string? service, CancellationToken ct);
}
