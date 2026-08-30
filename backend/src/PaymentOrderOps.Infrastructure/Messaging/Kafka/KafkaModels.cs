namespace PaymentOrderOps.Infrastructure.Messaging.Kafka;

public sealed record KafkaClusterInfo(
    string? OriginatingBroker,
    IReadOnlyList<KafkaBrokerInfo> Brokers,
    int TopicCount,
    int UnderReplicatedPartitions);

public sealed record KafkaBrokerInfo(int Id, string Host, int Port);

public sealed record KafkaTopic(
    string Name,
    int PartitionCount,
    int ReplicationFactor,
    int UnderReplicatedPartitions,
    long ApproxMessageCount,
    bool IsInternal,
    bool IsDeadLetter);

public sealed record KafkaTopicDetail(KafkaTopic Topic, IReadOnlyList<KafkaPartitionInfo> Partitions);

public sealed record KafkaPartitionInfo(
    int Partition,
    int Leader,
    IReadOnlyList<int> Replicas,
    IReadOnlyList<int> InSyncReplicas,
    long LowWatermark,
    long HighWatermark)
{
    public long MessageCount => Math.Max(0, HighWatermark - LowWatermark);

    public bool UnderReplicated => InSyncReplicas.Count < Replicas.Count;
}

public sealed record KafkaConsumerGroup(
    string GroupId,
    string State,
    bool IsSimple,
    int MemberCount,
    long TotalLag,
    IReadOnlyList<string> AssignedTopics);

public sealed record KafkaConsumerGroupDetail(
    KafkaConsumerGroup Group,
    string? PartitionAssignor,
    string? Coordinator,
    IReadOnlyList<KafkaConsumerGroupOffset> Offsets,
    IReadOnlyList<KafkaConsumerGroupMember> Members);

public sealed record KafkaConsumerGroupMember(
    string ConsumerId,
    string? ClientId,
    string? Host,
    IReadOnlyList<string> Assignment);

public sealed record KafkaConsumerGroupOffset(
    string Topic,
    int Partition,
    long CommittedOffset,
    long HighWatermark,
    long Lag);

public sealed record KafkaPreviewMessage(
    int Partition,
    long Offset,
    DateTimeOffset Timestamp,
    string? Key,
    string ValuePreview,
    bool ValueTruncated,
    int ValueBytes,
    IReadOnlyDictionary<string, string> Headers);
