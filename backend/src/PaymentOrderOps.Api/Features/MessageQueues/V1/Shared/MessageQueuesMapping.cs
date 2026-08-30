using PaymentOrderOps.Infrastructure.Messaging.Kafka;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;

internal static class MessageQueuesMapping
{
    public static RabbitMqHealthDetail ToDetail(this RabbitMqHealth health) => new(
        health.Overview.RabbitMqVersion,
        health.Overview.ClusterName,
        health.Overview.TotalQueues,
        health.Overview.TotalConnections,
        health.Overview.TotalConsumers,
        health.Overview.MessagesReady,
        health.Overview.MessagesUnacknowledged,
        health.AlarmsInEffect,
        [.. health.Nodes.Select(n => new RabbitMqNodeResponse(n.Node, n.Running, n.MemoryAlarm, n.DiskAlarm))]);

    public static KafkaHealthDetail ToDetail(this KafkaClusterInfo cluster) => new(
        cluster.OriginatingBroker,
        cluster.Brokers.Count,
        cluster.TopicCount,
        cluster.UnderReplicatedPartitions,
        [.. cluster.Brokers.Select(b => new KafkaBrokerResponse(b.Id, b.Host, b.Port))]);

    public static RabbitMqQueueResponse ToResponse(this RabbitMqQueue queue, long backlogReadyThreshold) => new(
        queue.Name,
        queue.VirtualHost,
        queue.State,
        queue.Messages,
        queue.MessagesReady,
        queue.MessagesUnacknowledged,
        queue.Consumers,
        queue.PublishRate,
        queue.DeliverRate,
        queue.RedeliverRate,
        queue.IdleSince,
        queue.IsDeadLetter,
        queue.HasDeadLetterConfigured,
        QueueCategories.For(queue, backlogReadyThreshold));

    public static RabbitMqQueueDetailResponse ToResponse(this RabbitMqQueueDetail detail, long backlogReadyThreshold) => new(
        detail.Queue.ToResponse(backlogReadyThreshold),
        detail.Arguments,
        detail.DeadLetterExchange,
        detail.DeadLetterRoutingKey,
        detail.MemoryBytes,
        [.. detail.Bindings.Select(b => new RabbitMqBindingResponse(b.Source, b.RoutingKey, b.DestinationType, b.Destination))]);

    public static RabbitMqMessageResponse ToResponse(this RabbitMqPreviewMessage message) => new(
        message.RemainingMessageCount,
        message.Redelivered,
        message.Exchange,
        message.RoutingKey,
        message.PayloadBytes,
        message.PayloadPreview,
        message.PayloadTruncated,
        message.Headers,
        [.. message.Deaths.Select(d => new RabbitMqDeathResponse(d.Reason, d.Queue, d.Exchange, d.Count, d.Time, d.RoutingKeys))]);

    public static KafkaTopicResponse ToResponse(this KafkaTopic topic) => new(
        topic.Name,
        topic.PartitionCount,
        topic.ReplicationFactor,
        topic.UnderReplicatedPartitions,
        topic.ApproxMessageCount,
        topic.IsInternal,
        topic.IsDeadLetter);

    public static KafkaTopicDetailResponse ToResponse(this KafkaTopicDetail detail) => new(
        detail.Topic.ToResponse(),
        [.. detail.Partitions.Select(p => new KafkaPartitionResponse(
            p.Partition, p.Leader, p.Replicas, p.InSyncReplicas, p.LowWatermark, p.HighWatermark, p.MessageCount, p.UnderReplicated))]);

    public static KafkaConsumerGroupResponse ToResponse(this KafkaConsumerGroup group) => new(
        group.GroupId,
        group.State,
        group.IsSimple,
        group.MemberCount,
        group.TotalLag,
        group.AssignedTopics);

    public static KafkaConsumerGroupDetailResponse ToResponse(this KafkaConsumerGroupDetail detail) => new(
        detail.Group.ToResponse(),
        detail.PartitionAssignor,
        detail.Coordinator,
        [.. detail.Offsets.Select(o => new KafkaConsumerGroupOffsetResponse(
            o.Topic, o.Partition, o.CommittedOffset, o.HighWatermark, o.Lag))],
        [.. detail.Members.Select(m => new KafkaConsumerGroupMemberResponse(m.ConsumerId, m.ClientId, m.Host, m.Assignment))]);

    public static KafkaMessageResponse ToResponse(this KafkaPreviewMessage message) => new(
        message.Partition,
        message.Offset,
        message.Timestamp,
        message.Key,
        message.ValuePreview,
        message.ValueTruncated,
        message.ValueBytes,
        message.Headers);

    public static PagedResponse<T> ToPage<T>(this IReadOnlyList<T> source, int? page, int? pageSize, int defaultPageSize = 50)
    {
        var size = Math.Clamp(pageSize ?? defaultPageSize, 1, 200);
        var totalPages = source.Count == 0 ? 0 : (int)Math.Ceiling(source.Count / (double)size);
        var current = Math.Clamp(page ?? 1, 1, Math.Max(1, totalPages));
        IReadOnlyList<T> items = [.. source.Skip((current - 1) * size).Take(size)];
        return new PagedResponse<T>(items, current, size, source.Count, totalPages);
    }
}
