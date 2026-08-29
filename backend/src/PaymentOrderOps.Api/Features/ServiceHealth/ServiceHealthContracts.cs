using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Api.Features.ServiceHealth;

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
