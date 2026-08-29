using System.Globalization;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Infrastructure.Persistence;

public static class ServiceHealthSeedData
{
    public static readonly DateTime Timestamp = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public static readonly IReadOnlyList<ServiceEnvironment> Environments =
        [ServiceEnvironment.Dev, ServiceEnvironment.Preprod, ServiceEnvironment.Production];

    public static readonly IReadOnlyList<Definition> Definitions =
    [
        new(1, "Payment Gateway", ServiceHealthGroup.Payment, "https://payment-gateway.boyner.internal/actuator/health"),
        new(2, "3DS Service", ServiceHealthGroup.Payment, "https://payment-3ds.boyner.internal/health"),
        new(3, "Wallet Service", ServiceHealthGroup.Payment, "https://wallet.boyner.internal/actuator/health/liveness"),
        new(4, "Order Orchestrator", ServiceHealthGroup.Order, "https://order-orchestrator.boyner.internal/health"),
        new(5, "Fulfillment Service", ServiceHealthGroup.Order, "https://fulfillment.boyner.internal/actuator/health"),
        new(6, "Notification Service", ServiceHealthGroup.Platform, "https://notification.boyner.internal/health"),
    ];

    public static Guid IdFor(ServiceEnvironment environment, int ordinal)
    {
        var envDigit = (int)environment + 1;
        var suffix = ordinal.ToString("D12", CultureInfo.InvariantCulture);
        return Guid.Parse($"0198f1a1-000{envDigit}-7000-8000-{suffix}");
    }

    public sealed record Definition(int Ordinal, string Name, ServiceHealthGroup Group, string Url);
}
