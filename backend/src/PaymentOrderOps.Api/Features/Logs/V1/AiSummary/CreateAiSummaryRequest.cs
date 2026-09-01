namespace PaymentOrderOps.Api.Features.Logs.V1.AiSummary;

public sealed record CreateAiSummaryRequest(
    DateTimeOffset From,
    DateTimeOffset To,
    AiSummaryFilters? Filters,
    bool? Force);

public sealed record AiSummaryFilters(
    string? Text,
    string? Level,
    string? Service,
    string? TraceId);
