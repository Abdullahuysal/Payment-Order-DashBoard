using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Ai;
using PaymentOrderOps.Infrastructure.Logs;

namespace PaymentOrderOps.Api.Features.Logs.V1.Shared;

/// <summary>
/// Request-scoped: picks the Elasticsearch connection block and the Anthropic connection for
/// the caller's <c>X-Environment</c>. <see cref="RequireElasticsearch"/> throws
/// <see cref="LogSearchNotConfiguredException"/> (→ 503); <see cref="RequireAi"/> throws
/// <see cref="AiNotConfiguredException"/> (→ 503).
/// </summary>
public sealed class LogSearchResolver(
    LogSearchOptions logOptions, AiSummaryOptions aiOptions, IEnvironmentContext environment)
{
    public string EnvironmentName => environment.Environment.ToString();

    public ElasticsearchOptions? Elasticsearch =>
        logOptions.For(EnvironmentName)?.Elasticsearch is { IsConfigured: true } value ? value : null;

    public ElasticsearchOptions RequireElasticsearch() =>
        Elasticsearch ?? throw new LogSearchNotConfiguredException(EnvironmentName);

    public AnthropicConnection RequireAi() =>
        aiOptions.For(EnvironmentName) is { IsConfigured: true } value
            ? new AnthropicConnection(EnvironmentName, value)
            : throw new AiNotConfiguredException(EnvironmentName);
}
