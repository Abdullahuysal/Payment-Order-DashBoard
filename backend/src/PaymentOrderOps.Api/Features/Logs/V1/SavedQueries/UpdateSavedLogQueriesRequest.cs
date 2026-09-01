namespace PaymentOrderOps.Api.Features.Logs.V1.SavedQueries;

public sealed record UpdateSavedLogQueriesRequest(IReadOnlyList<SavedLogQueryInput>? Queries);

public sealed record SavedLogQueryInput(
    string? Name,
    string? Text,
    string? Level,
    string? Service,
    string? TraceId);
