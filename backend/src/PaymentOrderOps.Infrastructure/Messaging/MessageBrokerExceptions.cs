using PaymentOrderOps.Domain.Messaging;

namespace PaymentOrderOps.Infrastructure.Messaging;

/// <summary>No connection details are configured for this broker in the current environment (→ 503).</summary>
public sealed class MessageBrokerNotConfiguredException(MessageBrokerKind broker, string environment)
    : Exception($"{broker} is not configured for the '{environment}' environment.")
{
    public MessageBrokerKind Broker { get; } = broker;

    public string Environment { get; } = environment;
}

/// <summary>The broker is configured but could not be reached or answered with an error (→ 502).</summary>
public sealed class MessageBrokerUnreachableException(MessageBrokerKind broker, string reason, Exception? innerException = null)
    : Exception($"{broker} could not be reached: {reason}", innerException)
{
    public MessageBrokerKind Broker { get; } = broker;
}
