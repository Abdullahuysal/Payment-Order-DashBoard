namespace PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

public sealed record RabbitMqOverview(
    string RabbitMqVersion,
    string? ProductVersion,
    string ClusterName,
    string? Node,
    int TotalQueues,
    int TotalConnections,
    int TotalConsumers,
    long MessagesTotal,
    long MessagesReady,
    long MessagesUnacknowledged);

public sealed record RabbitMqNodeAlarm(string Node, bool MemoryAlarm, bool DiskAlarm, bool Running);

public sealed record RabbitMqHealth(
    RabbitMqOverview Overview,
    IReadOnlyList<RabbitMqNodeAlarm> Nodes,
    bool AlarmsInEffect);

public sealed record RabbitMqQueue(
    string Name,
    string VirtualHost,
    string State,
    long Messages,
    long MessagesReady,
    long MessagesUnacknowledged,
    int Consumers,
    double PublishRate,
    double DeliverRate,
    double RedeliverRate,
    DateTimeOffset? IdleSince,
    bool IsDeadLetter,
    bool HasDeadLetterConfigured);

public sealed record RabbitMqQueueDetail(
    RabbitMqQueue Queue,
    IReadOnlyDictionary<string, string> Arguments,
    string? DeadLetterExchange,
    string? DeadLetterRoutingKey,
    long MemoryBytes,
    IReadOnlyList<RabbitMqBinding> Bindings);

public sealed record RabbitMqBinding(string Source, string RoutingKey, string DestinationType, string Destination);

public sealed record RabbitMqPreviewMessage(
    long RemainingMessageCount,
    bool Redelivered,
    string Exchange,
    string RoutingKey,
    int PayloadBytes,
    string PayloadPreview,
    bool PayloadTruncated,
    IReadOnlyDictionary<string, string> Headers,
    IReadOnlyList<RabbitMqDeathRecord> Deaths);

public sealed record RabbitMqDeathRecord(
    string Reason,
    string Queue,
    string Exchange,
    long Count,
    DateTimeOffset? Time,
    IReadOnlyList<string> RoutingKeys);
