using PaymentOrderOps.Domain.Messaging;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;

public sealed record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount, int TotalPages);

public sealed record BrokerSummaryResponse(
    string Broker,
    bool Configured,
    bool Reachable,
    string? Version,
    string? Detail,
    string? Error);

public sealed record BrokerHealthResponse(
    string Broker,
    bool Reachable,
    string? Error,
    RabbitMqHealthDetail? RabbitMq,
    KafkaHealthDetail? Kafka);

public sealed record RabbitMqHealthDetail(
    string Version,
    string ClusterName,
    int Queues,
    int Connections,
    int Consumers,
    long MessagesReady,
    long MessagesUnacknowledged,
    bool AlarmsInEffect,
    IReadOnlyList<RabbitMqNodeResponse> Nodes);

public sealed record RabbitMqNodeResponse(string Node, bool Running, bool MemoryAlarm, bool DiskAlarm);

public sealed record KafkaHealthDetail(
    string? OriginatingBroker,
    int Brokers,
    int Topics,
    int UnderReplicatedPartitions,
    IReadOnlyList<KafkaBrokerResponse> BrokerNodes);

public sealed record KafkaBrokerResponse(int Id, string Host, int Port);

public sealed record RabbitMqQueueResponse(
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
    bool HasDeadLetterConfigured,
    IReadOnlyList<string> Categories);

public sealed record RabbitMqQueueDetailResponse(
    RabbitMqQueueResponse Queue,
    IReadOnlyDictionary<string, string> Arguments,
    string? DeadLetterExchange,
    string? DeadLetterRoutingKey,
    long MemoryBytes,
    IReadOnlyList<RabbitMqBindingResponse> Bindings);

public sealed record RabbitMqBindingResponse(string Source, string RoutingKey, string DestinationType, string Destination);

public sealed record RabbitMqMessageResponse(
    long RemainingMessageCount,
    bool Redelivered,
    string Exchange,
    string RoutingKey,
    int PayloadBytes,
    string PayloadPreview,
    bool PayloadTruncated,
    IReadOnlyDictionary<string, string> Headers,
    IReadOnlyList<RabbitMqDeathResponse> Deaths);

public sealed record RabbitMqDeathResponse(
    string Reason,
    string Queue,
    string Exchange,
    long Count,
    DateTimeOffset? Time,
    IReadOnlyList<string> RoutingKeys);

public sealed record KafkaTopicResponse(
    string Name,
    int Partitions,
    int ReplicationFactor,
    int UnderReplicatedPartitions,
    long ApproxMessageCount,
    bool IsInternal,
    bool IsDeadLetter);

public sealed record KafkaTopicDetailResponse(KafkaTopicResponse Topic, IReadOnlyList<KafkaPartitionResponse> Partitions);

public sealed record KafkaPartitionResponse(
    int Partition,
    int Leader,
    IReadOnlyList<int> Replicas,
    IReadOnlyList<int> InSyncReplicas,
    long LowWatermark,
    long HighWatermark,
    long MessageCount,
    bool UnderReplicated);

public sealed record KafkaConsumerGroupResponse(
    string GroupId,
    string State,
    bool IsSimple,
    int Members,
    long TotalLag,
    IReadOnlyList<string> Topics);

public sealed record KafkaConsumerGroupDetailResponse(
    KafkaConsumerGroupResponse Group,
    string? PartitionAssignor,
    string? Coordinator,
    IReadOnlyList<KafkaConsumerGroupOffsetResponse> Offsets,
    IReadOnlyList<KafkaConsumerGroupMemberResponse> Members);

public sealed record KafkaConsumerGroupOffsetResponse(
    string Topic,
    int Partition,
    long CommittedOffset,
    long HighWatermark,
    long Lag);

public sealed record KafkaConsumerGroupMemberResponse(
    string ConsumerId,
    string? ClientId,
    string? Host,
    IReadOnlyList<string> Assignment);

public sealed record KafkaMessageResponse(
    int Partition,
    long Offset,
    DateTimeOffset Timestamp,
    string? Key,
    string ValuePreview,
    bool ValueTruncated,
    int ValueBytes,
    IReadOnlyDictionary<string, string> Headers);

public sealed record DeadLetterSummaryResponse(
    string Broker,
    string Kind,
    string Name,
    long MessageCount,
    DateTimeOffset? SampledAt,
    string? LastReason);

public sealed record DeadLetterOverviewResponse(
    IReadOnlyList<DeadLetterSummaryResponse> Items,
    long TotalDeadLettered,
    long ScopedTotalDeadLettered,
    IReadOnlyList<string> Warnings);

public sealed record QueueAlertResponse(
    QueueAlertSeverity Severity,
    string Broker,
    string Resource,
    string Kind,
    string Message,
    long? Value);
