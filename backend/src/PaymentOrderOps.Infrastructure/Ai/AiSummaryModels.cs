namespace PaymentOrderOps.Infrastructure.Ai;

/// <summary>Resolved Anthropic connection for one environment, passed to the summarizer per call.</summary>
public sealed record AnthropicConnection(string Environment, AnthropicOptions Options);

/// <summary>
/// The LLM's structured answer. Matches the JSON contract
/// <c>{ headline, groups:[{ index, rootCauseGuess, impact, suggestedAction, confidence }] }</c>.
/// </summary>
public sealed record AiLogSummary(string Headline, IReadOnlyList<AiLogSummaryGroup> Groups);

public sealed record AiLogSummaryGroup(
    int Index,
    string RootCauseGuess,
    string Impact,
    string SuggestedAction,
    string Confidence);
