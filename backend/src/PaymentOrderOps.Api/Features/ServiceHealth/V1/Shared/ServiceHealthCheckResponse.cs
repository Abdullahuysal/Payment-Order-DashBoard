using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;

/// <summary>Wire shape returned by every read and write slice in this feature version.</summary>
public sealed record ServiceHealthCheckResponse(
    Guid Id,
    ServiceEnvironment Environment,
    string Name,
    ServiceHealthGroup Group,
    string Method,
    string Url,
    IReadOnlyDictionary<string, string> Headers,
    string? Body,
    int ExpectedStatus,
    bool IsEnabled,
    ServiceHealthSource Source,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string RowVersion);
