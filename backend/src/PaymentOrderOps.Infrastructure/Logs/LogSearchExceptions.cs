namespace PaymentOrderOps.Infrastructure.Logs;

/// <summary>No Elasticsearch connection is configured for the current environment (→ 503).</summary>
public sealed class LogSearchNotConfiguredException(string environment)
    : Exception($"Log search (Elasticsearch) is not configured for the '{environment}' environment.")
{
    public string Environment { get; } = environment;
}

/// <summary>Elasticsearch is configured but the transport failed or it answered with an error (→ 502).</summary>
public sealed class LogSearchUnreachableException(string reason, Exception? innerException = null)
    : Exception($"Elasticsearch could not be reached: {reason}", innerException);
