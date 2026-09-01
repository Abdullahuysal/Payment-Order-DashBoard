namespace PaymentOrderOps.Infrastructure.Ai;

/// <summary>
/// Bound from the <c>Ai</c> configuration section, one entry per logical environment. A blank
/// <see cref="AnthropicOptions.ApiKey"/> means "not configured" and the AI endpoints answer
/// <c>503</c>. The key comes from environment variables / user-secrets today
/// (<c>Ai__Dev__ApiKey</c>), Vault later — same key path.
/// </summary>
public sealed class AiSummaryOptions
{
    public const string SectionName = "Ai";

    public Dictionary<string, AnthropicOptions> Environments { get; init; } =
        new(StringComparer.OrdinalIgnoreCase);

    public AnthropicOptions? For(string environment) =>
        Environments.TryGetValue(environment, out var value) ? value : null;
}

public sealed class AnthropicOptions
{
    public string ApiKey { get; init; } = string.Empty;

    public string BaseUrl { get; init; } = "https://api.anthropic.com";

    public string Model { get; init; } = "claude-sonnet-4-20250514";

    /// <summary>Required exact value of the <c>anthropic-version</c> request header.</summary>
    public string AnthropicVersion { get; init; } = "2023-06-01";

    public int MaxTokens { get; init; } = 1024;

    public int TimeoutSeconds { get; init; } = 60;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}
