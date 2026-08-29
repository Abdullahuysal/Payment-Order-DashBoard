using System.Globalization;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Api.Features.ServiceHealth;

internal static class ServiceHealthMapping
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

    public static ServiceHealthCheck ToNewEntity(this CreateServiceHealthCheckRequest request, ServiceEnvironment environment)
    {
        ServiceHealthHttpMethodExtensions.TryParse(request.Method, out var method);
        return new ServiceHealthCheck(
            Guid.CreateVersion7(),
            environment,
            request.Name,
            request.Group,
            method,
            request.Url,
            request.Headers,
            request.Body,
            request.ExpectedStatus ?? 200,
            request.IsEnabled ?? true,
            ServiceHealthSource.Custom);
    }

    public static void ApplyUpdate(this ServiceHealthCheck entity, UpdateServiceHealthCheckRequest request)
    {
        ServiceHealthHttpMethodExtensions.TryParse(request.Method, out var method);
        entity.Update(
            request.Name,
            request.Group,
            method,
            request.Url,
            request.Headers,
            request.Body,
            request.ExpectedStatus ?? 200,
            request.IsEnabled ?? true);
    }
}
