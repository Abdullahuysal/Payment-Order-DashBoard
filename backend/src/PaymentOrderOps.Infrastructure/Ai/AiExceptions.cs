namespace PaymentOrderOps.Infrastructure.Ai;

/// <summary>No Anthropic API key is configured for the current environment (→ 503).</summary>
public sealed class AiNotConfiguredException(string environment)
    : Exception($"AI summarization is not configured for the '{environment}' environment.")
{
    public string Environment { get; } = environment;
}

/// <summary>The Anthropic API is configured but the call failed or returned an unusable answer (→ 502).</summary>
public sealed class AiUnreachableException(string reason, Exception? innerException = null)
    : Exception($"The AI provider could not be reached: {reason}", innerException);
