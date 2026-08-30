using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.CreateCheck;

public sealed record CreateServiceHealthCheckRequest(
    string Name,
    ServiceHealthGroup Group,
    string Method,
    string Url,
    IReadOnlyDictionary<string, string>? Headers,
    string? Body,
    int? ExpectedStatus,
    bool? IsEnabled,
    ServiceEnvironment? Environment);
