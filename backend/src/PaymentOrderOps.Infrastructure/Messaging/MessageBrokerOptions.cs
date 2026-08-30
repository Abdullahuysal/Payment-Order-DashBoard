namespace PaymentOrderOps.Infrastructure.Messaging;

/// <summary>
/// Bound from the <c>MessageBrokers</c> configuration section. One entry per logical
/// environment (<c>Dev</c> / <c>Preprod</c> / <c>Production</c>); a missing entry or a
/// missing broker block means "not configured for that environment" and the matching
/// endpoints answer <c>503</c>. Secrets come from environment variables / user-secrets
/// today (<c>MessageBrokers__Dev__RabbitMq__Password</c>), Vault later — same key path.
/// </summary>
public sealed class MessageBrokersOptions
{
    public const string SectionName = "MessageBrokers";

    public Dictionary<string, BrokerEnvironmentOptions> Environments { get; init; } =
        new(StringComparer.OrdinalIgnoreCase);

    public BrokerEnvironmentOptions? For(string environment) =>
        Environments.TryGetValue(environment, out var value) ? value : null;
}

public sealed class BrokerEnvironmentOptions
{
    public RabbitMqOptions? RabbitMq { get; init; }

    public KafkaOptions? Kafka { get; init; }
}

public sealed class RabbitMqOptions
{
    /// <summary>Base URL of the RabbitMQ management plugin, e.g. <c>http://rabbit.internal:15672</c>.</summary>
    public string ManagementUrl { get; init; } = string.Empty;

    public string Username { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;

    public string VirtualHost { get; init; } = "/";

    /// <summary>Glob patterns (<c>*</c>, <c>?</c>) that mark a queue as a dead-letter queue.</summary>
    public string[] DeadLetterQueuePatterns { get; init; } = [];

    /// <summary><c>messagesReady</c> at or above this with consumers present still counts as a backlog.</summary>
    public long BacklogReadyThreshold { get; init; } = 100;

    public int MessagePreviewCountLimit { get; init; } = 50;

    public int MessagePreviewMaxBytes { get; init; } = 8192;

    public int RequestTimeoutSeconds { get; init; } = 10;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ManagementUrl);
}

public sealed class KafkaOptions
{
    public string BootstrapServers { get; init; } = string.Empty;

    /// <summary><c>Plaintext</c> | <c>Ssl</c> | <c>SaslPlaintext</c> | <c>SaslSsl</c>.</summary>
    public string SecurityProtocol { get; init; } = "Plaintext";

    /// <summary><c>Plain</c> | <c>ScramSha256</c> | <c>ScramSha512</c> | <c>Gssapi</c> | <c>OAuthBearer</c>.</summary>
    public string? SaslMechanism { get; init; }

    public string? SaslUsername { get; init; }

    public string? SaslPassword { get; init; }

    /// <summary>Glob patterns (<c>*</c>, <c>?</c>) that mark a topic as a dead-letter topic.</summary>
    public string[] DeadLetterTopicPatterns { get; init; } = [];

    public long ConsumerGroupLagWarningThreshold { get; init; } = 1_000;

    public long ConsumerGroupLagCriticalThreshold { get; init; } = 25_000;

    public int MessagePreviewCountLimit { get; init; } = 50;

    public int MessagePreviewMaxBytes { get; init; } = 8192;

    public int AdminTimeoutSeconds { get; init; } = 10;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(BootstrapServers);
}
