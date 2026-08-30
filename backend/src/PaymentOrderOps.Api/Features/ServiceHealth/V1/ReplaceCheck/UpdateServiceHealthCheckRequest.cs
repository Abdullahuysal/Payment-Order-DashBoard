using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.ReplaceCheck;

public sealed record UpdateServiceHealthCheckRequest(
    string Name,
    ServiceHealthGroup Group,
    string Method,
    string Url,
    IReadOnlyDictionary<string, string>? Headers,
    string? Body,
    int? ExpectedStatus,
    bool? IsEnabled,
    string? RowVersion,
    ServiceEnvironment? Environment);
