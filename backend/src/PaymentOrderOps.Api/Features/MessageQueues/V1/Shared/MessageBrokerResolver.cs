using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.Messaging;
using PaymentOrderOps.Infrastructure.Messaging;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;

/// <summary>
/// Request-scoped: picks the broker connection block for the caller's <c>X-Environment</c>.
/// <see cref="RequireRabbitMq"/> / <see cref="RequireKafka"/> throw
/// <see cref="MessageBrokerNotConfiguredException"/> (→ 503) when nothing is configured.
/// </summary>
public sealed class MessageBrokerResolver(MessageBrokersOptions options, IEnvironmentContext environment)
{
    public string EnvironmentName => environment.Environment.ToString();

    public RabbitMqOptions? RabbitMq =>
        options.For(EnvironmentName)?.RabbitMq is { IsConfigured: true } value ? value : null;

    public KafkaOptions? Kafka =>
        options.For(EnvironmentName)?.Kafka is { IsConfigured: true } value ? value : null;

    public RabbitMqOptions RequireRabbitMq() =>
        RabbitMq ?? throw new MessageBrokerNotConfiguredException(MessageBrokerKind.RabbitMq, EnvironmentName);

    public KafkaOptions RequireKafka() =>
        Kafka ?? throw new MessageBrokerNotConfiguredException(MessageBrokerKind.Kafka, EnvironmentName);
}
