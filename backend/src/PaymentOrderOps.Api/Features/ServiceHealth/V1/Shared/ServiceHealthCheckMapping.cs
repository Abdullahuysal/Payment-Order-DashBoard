using System.Globalization;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;

internal static class ServiceHealthCheckMapping
{
    public static ServiceHealthCheckResponse ToResponse(this ServiceHealthCheck entity) => new(
        entity.Id,
        entity.Environment,
        entity.Name,
        entity.Group,
        entity.Method.ToWireValue(),
        entity.Url,
        entity.Headers,
        entity.Body,
        entity.ExpectedStatusCode,
        entity.IsEnabled,
        entity.Source,
        entity.CreatedAtUtc,
        entity.UpdatedAtUtc,
        entity.Xmin.ToString(CultureInfo.InvariantCulture));
}
