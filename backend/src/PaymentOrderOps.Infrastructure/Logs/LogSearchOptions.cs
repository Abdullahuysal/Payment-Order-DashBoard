namespace PaymentOrderOps.Infrastructure.Logs;

/// <summary>
/// Bound from the <c>Logs</c> configuration section. One entry per logical environment
/// (<c>Dev</c> / <c>Preprod</c> / <c>Production</c>); a missing entry or a blank
/// <see cref="ElasticsearchOptions.Uri"/> means "not configured for that environment" and the
/// log endpoints answer <c>503</c>. Secrets come from environment variables / user-secrets
/// today (<c>Logs__Dev__Elasticsearch__ApiKey</c>), Vault later — same key path.
/// </summary>
public sealed class LogSearchOptions
{
    public const string SectionName = "Logs";

    public Dictionary<string, LogEnvironmentOptions> Environments { get; init; } =
        new(StringComparer.OrdinalIgnoreCase);

    public LogEnvironmentOptions? For(string environment) =>
        Environments.TryGetValue(environment, out var value) ? value : null;
}

public sealed class LogEnvironmentOptions
{
    public ElasticsearchOptions? Elasticsearch { get; init; }
}

public sealed class ElasticsearchOptions
{
    /// <summary>Base URL of the Elasticsearch HTTP API, e.g. <c>https://logs.internal:9200</c>.</summary>
    public string Uri { get; init; } = string.Empty;

    public string Username { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;

    /// <summary>Base64 <c>id:api_key</c> pair; takes precedence over basic auth when set.</summary>
    public string ApiKey { get; init; } = string.Empty;

    /// <summary>Index or data-stream pattern searched for every query, e.g. <c>logs-*</c>.</summary>
    public string IndexPattern { get; init; } = "logs-*";

    /// <summary>Field-name overrides layered on top of <see cref="LogFieldMap.EcsDefault"/>.</summary>
    public Dictionary<string, string> FieldMap { get; init; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>Source fields whose value is replaced with <c>***</c> before a hit leaves the gateway.</summary>
    public string[] RedactFields { get; init; } = [];

    public int MaxPageSize { get; init; } = 200;

    public int ExceptionScanSize { get; init; } = 2000;

    public int RequestTimeoutSeconds { get; init; } = 15;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Uri);
}
