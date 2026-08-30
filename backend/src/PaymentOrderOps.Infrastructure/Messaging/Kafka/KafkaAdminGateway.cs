using System.Text;
using Confluent.Kafka;
using Confluent.Kafka.Admin;
using PaymentOrderOps.Domain.Messaging;

namespace PaymentOrderOps.Infrastructure.Messaging.Kafka;

public interface IKafkaAdminGateway
{
    Task<KafkaClusterInfo> GetClusterInfoAsync(KafkaOptions options, CancellationToken ct);

    Task<IReadOnlyList<KafkaTopic>> ListTopicsAsync(KafkaOptions options, CancellationToken ct);

    Task<KafkaTopicDetail?> GetTopicAsync(KafkaOptions options, string name, CancellationToken ct);

    Task<IReadOnlyList<KafkaConsumerGroup>> ListConsumerGroupsAsync(KafkaOptions options, CancellationToken ct);

    Task<KafkaConsumerGroupDetail?> GetConsumerGroupAsync(KafkaOptions options, string groupId, CancellationToken ct);

    Task<IReadOnlyList<KafkaPreviewMessage>?> PeekMessagesAsync(
        KafkaOptions options, string topic, int? partition, long? fromOffset, int count, CancellationToken ct);
}

public sealed class KafkaAdminGateway : IKafkaAdminGateway
{
    public Task<KafkaClusterInfo> GetClusterInfoAsync(KafkaOptions options, CancellationToken ct) =>
        Run(options, admin =>
        {
            var metadata = GetMetadata(options, admin);
            var underReplicated = metadata.Topics.Sum(CountUnderReplicated);
            return new KafkaClusterInfo(
                metadata.OriginatingBrokerName,
                [.. metadata.Brokers.Select(b => new KafkaBrokerInfo(b.BrokerId, b.Host, b.Port))],
                metadata.Topics.Count,
                underReplicated);
        });

    public Task<IReadOnlyList<KafkaTopic>> ListTopicsAsync(KafkaOptions options, CancellationToken ct) =>
        Run(options, admin =>
        {
            var metadata = GetMetadata(options, admin);
            IReadOnlyList<KafkaTopic> topics = [.. metadata.Topics.Select(t => MapTopic(t, options, approxCount: -1))];
            return topics;
        });

    public Task<KafkaTopicDetail?> GetTopicAsync(KafkaOptions options, string name, CancellationToken ct) =>
        Run<KafkaTopicDetail?>(options, admin =>
        {
            var metadata = GetMetadata(options, admin);
            var topic = metadata.Topics.FirstOrDefault(t => t.Topic == name);
            if (topic is null || topic.Error.IsError)
            {
                return (KafkaTopicDetail?)null;
            }

            using var consumer = BuildConsumer(options);
            var partitions = new List<KafkaPartitionInfo>();
            long total = 0;
            foreach (var p in topic.Partitions)
            {
                var (low, high) = QueryWatermarks(options, consumer, new TopicPartition(name, p.PartitionId));
                total += Math.Max(0, high - low);
                partitions.Add(new KafkaPartitionInfo(
                    p.PartitionId, p.Leader, p.Replicas, p.InSyncReplicas, low, high));
            }

            return new KafkaTopicDetail(MapTopic(topic, options, total), partitions);
        });

    public Task<IReadOnlyList<KafkaConsumerGroup>> ListConsumerGroupsAsync(KafkaOptions options, CancellationToken ct) =>
        Run(options, async admin =>
        {
            var timeout = Timeout(options);
            var listing = await admin.ListConsumerGroupsAsync(new ListConsumerGroupsOptions { RequestTimeout = timeout });
            var groups = listing.Valid;

            using var consumer = BuildConsumer(options);
            var watermarks = new Dictionary<TopicPartition, long>();
            var result = new List<KafkaConsumerGroup>(groups.Count);

            foreach (var group in groups)
            {
                var offsets = await LoadGroupOffsetsAsync(options, admin, consumer, group.GroupId, watermarks);
                result.Add(new KafkaConsumerGroup(
                    group.GroupId,
                    group.State.ToString(),
                    group.IsSimpleConsumerGroup,
                    MemberCountSafe(admin, group.GroupId, timeout),
                    offsets.Sum(o => o.Lag),
                    [.. offsets.Select(o => o.Topic).Distinct().OrderBy(x => x, StringComparer.Ordinal)]));
            }

            IReadOnlyList<KafkaConsumerGroup> ordered = [.. result.OrderByDescending(g => g.TotalLag)];
            return ordered;
        });

    public Task<KafkaConsumerGroupDetail?> GetConsumerGroupAsync(KafkaOptions options, string groupId, CancellationToken ct) =>
        Run<KafkaConsumerGroupDetail?>(options, async admin =>
        {
            var timeout = Timeout(options);
            var described = await admin.DescribeConsumerGroupsAsync(
                [groupId], new DescribeConsumerGroupsOptions { RequestTimeout = timeout });
            var description = described.ConsumerGroupDescriptions.FirstOrDefault(d => d.GroupId == groupId);
            if (description is null)
            {
                return (KafkaConsumerGroupDetail?)null;
            }

            using var consumer = BuildConsumer(options);
            var offsets = await LoadGroupOffsetsAsync(options, admin, consumer, groupId, new Dictionary<TopicPartition, long>());

            var members = description.Members
                .Select(m => new KafkaConsumerGroupMember(
                    m.ConsumerId,
                    m.ClientId,
                    m.Host,
                    [.. (m.Assignment?.TopicPartitions ?? []).Select(tp => $"{tp.Topic}-{tp.Partition.Value}")]))
                .ToList();

            var group = new KafkaConsumerGroup(
                groupId,
                description.State.ToString(),
                description.IsSimpleConsumerGroup,
                members.Count,
                offsets.Sum(o => o.Lag),
                [.. offsets.Select(o => o.Topic).Distinct().OrderBy(x => x, StringComparer.Ordinal)]);

            return new KafkaConsumerGroupDetail(
                group,
                description.PartitionAssignor,
                description.Coordinator?.ToString(),
                offsets,
                members);
        });

    public Task<IReadOnlyList<KafkaPreviewMessage>?> PeekMessagesAsync(
        KafkaOptions options, string topic, int? partition, long? fromOffset, int count, CancellationToken ct) =>
        Run<IReadOnlyList<KafkaPreviewMessage>?>(options, admin =>
        {
            var clamped = Math.Clamp(count, 1, options.MessagePreviewCountLimit);
            var metadata = GetMetadata(options, admin);
            var topicMeta = metadata.Topics.FirstOrDefault(t => t.Topic == topic);
            if (topicMeta is null || topicMeta.Error.IsError)
            {
                return (IReadOnlyList<KafkaPreviewMessage>?)null;
            }

            var partitionIds = partition.HasValue
                ? topicMeta.Partitions.Where(p => p.PartitionId == partition.Value).Select(p => p.PartitionId).ToList()
                : topicMeta.Partitions.Select(p => p.PartitionId).ToList();

            if (partitionIds.Count == 0)
            {
                return (IReadOnlyList<KafkaPreviewMessage>?)null;
            }

            using var consumer = BuildConsumer(options);
            var assignments = new List<TopicPartitionOffset>();
            foreach (var p in partitionIds)
            {
                var tp = new TopicPartition(topic, p);
                var (low, high) = QueryWatermarks(options, consumer, tp);
                var start = fromOffset ?? Math.Max(low, high - clamped);
                start = Math.Clamp(start, low, Math.Max(low, high));
                assignments.Add(new TopicPartitionOffset(tp, new Offset(start)));
            }

            consumer.Assign(assignments);

            var messages = new List<KafkaPreviewMessage>();
            var idleReads = 0;
            while (messages.Count < clamped && idleReads < 3)
            {
                var result = consumer.Consume(TimeSpan.FromMilliseconds(750));
                if (result is null || result.IsPartitionEOF)
                {
                    idleReads++;
                    continue;
                }

                idleReads = 0;
                messages.Add(MapMessage(result, options));
            }

            consumer.Unassign();
            IReadOnlyList<KafkaPreviewMessage> ordered =
                [.. messages.OrderBy(m => m.Timestamp).ThenBy(m => m.Partition).ThenBy(m => m.Offset)];
            return (IReadOnlyList<KafkaPreviewMessage>?)ordered;
        });

    private async Task<List<KafkaConsumerGroupOffset>> LoadGroupOffsetsAsync(
        KafkaOptions options,
        IAdminClient admin,
        IConsumer<byte[], byte[]> consumer,
        string groupId,
        Dictionary<TopicPartition, long> watermarkCache)
    {
        var timeout = Timeout(options);
        List<ListConsumerGroupOffsetsResult> results;
        try
        {
            results = await admin.ListConsumerGroupOffsetsAsync(
                [new ConsumerGroupTopicPartitions(groupId, null)],
                new ListConsumerGroupOffsetsOptions { RequestTimeout = timeout });
        }
        catch (KafkaException)
        {
            return [];
        }

        var offsets = new List<KafkaConsumerGroupOffset>();
        foreach (var partition in results.SelectMany(r => r.Partitions))
        {
            if (partition.Error.IsError || partition.Offset == Offset.Unset)
            {
                continue;
            }

            var tp = partition.TopicPartition;
            if (!watermarkCache.TryGetValue(tp, out var high))
            {
                var (_, watermarkHigh) = QueryWatermarks(options, consumer, tp);
                high = watermarkHigh;
                watermarkCache[tp] = high;
            }

            var committed = partition.Offset.Value;
            offsets.Add(new KafkaConsumerGroupOffset(
                tp.Topic, tp.Partition.Value, committed, high, Math.Max(0, high - committed)));
        }

        return [.. offsets.OrderBy(o => o.Topic, StringComparer.Ordinal).ThenBy(o => o.Partition)];
    }

    private static int MemberCountSafe(IAdminClient admin, string groupId, TimeSpan timeout)
    {
        try
        {
            var described = admin
                .DescribeConsumerGroupsAsync([groupId], new DescribeConsumerGroupsOptions { RequestTimeout = timeout })
                .GetAwaiter().GetResult();
            return described.ConsumerGroupDescriptions.FirstOrDefault(d => d.GroupId == groupId)?.Members.Count ?? 0;
        }
        catch (KafkaException)
        {
            return 0;
        }
    }

    private static (long Low, long High) QueryWatermarks(
        KafkaOptions options, IConsumer<byte[], byte[]> consumer, TopicPartition tp)
    {
        try
        {
            var watermarks = consumer.QueryWatermarkOffsets(tp, Timeout(options));
            return (watermarks.Low.Value, watermarks.High.Value);
        }
        catch (KafkaException ex)
        {
            throw new MessageBrokerUnreachableException(
                MessageBrokerKind.Kafka, $"could not read watermark offsets for {tp}: {ex.Message}", ex);
        }
    }

    private static Metadata GetMetadata(KafkaOptions options, IAdminClient admin)
    {
        Metadata metadata;
        try
        {
            metadata = admin.GetMetadata(Timeout(options));
        }
        catch (KafkaException ex)
        {
            throw new MessageBrokerUnreachableException(MessageBrokerKind.Kafka, ex.Message, ex);
        }

        if (metadata.Brokers.Count == 0)
        {
            throw new MessageBrokerUnreachableException(
                MessageBrokerKind.Kafka, "no brokers answered the metadata request (check BootstrapServers / credentials)");
        }

        return metadata;
    }

    private static KafkaTopic MapTopic(TopicMetadata topic, KafkaOptions options, long approxCount)
    {
        var replicationFactor = topic.Partitions.Count == 0 ? 0 : topic.Partitions.Max(p => p.Replicas.Length);
        var isInternal = topic.Topic.StartsWith("__", StringComparison.Ordinal);
        return new KafkaTopic(
            topic.Topic,
            topic.Partitions.Count,
            replicationFactor,
            CountUnderReplicated(topic),
            approxCount,
            isInternal,
            GlobPattern.MatchesAny(topic.Topic, options.DeadLetterTopicPatterns));
    }

    private static int CountUnderReplicated(TopicMetadata topic) =>
        topic.Partitions.Count(p => p.InSyncReplicas.Length < p.Replicas.Length);

    private static KafkaPreviewMessage MapMessage(ConsumeResult<byte[], byte[]> result, KafkaOptions options)
    {
        var headers = new Dictionary<string, string>(StringComparer.Ordinal);
        if (result.Message.Headers is { } rawHeaders)
        {
            foreach (var header in rawHeaders)
            {
                headers[header.Key] = Decode(header.GetValueBytes(), options.MessagePreviewMaxBytes, out _);
            }
        }

        var value = Decode(result.Message.Value, options.MessagePreviewMaxBytes, out var truncated);
        return new KafkaPreviewMessage(
            result.Partition.Value,
            result.Offset.Value,
            new DateTimeOffset(result.Message.Timestamp.UtcDateTime, TimeSpan.Zero),
            result.Message.Key is null ? null : Decode(result.Message.Key, options.MessagePreviewMaxBytes, out _),
            value,
            truncated,
            result.Message.Value?.Length ?? 0,
            headers);
    }

    private static string Decode(byte[]? bytes, int maxBytes, out bool truncated)
    {
        truncated = false;
        if (bytes is null || bytes.Length == 0)
        {
            return string.Empty;
        }

        var slice = bytes;
        if (bytes.Length > maxBytes)
        {
            slice = bytes[..maxBytes];
            truncated = true;
        }

        return Encoding.UTF8.GetString(slice);
    }

    private static TimeSpan Timeout(KafkaOptions options) =>
        TimeSpan.FromSeconds(Math.Max(1, options.AdminTimeoutSeconds));

    private static ClientConfig BuildClientConfig(KafkaOptions options)
    {
        var config = new ClientConfig { BootstrapServers = options.BootstrapServers };

        if (Enum.TryParse<SecurityProtocol>(options.SecurityProtocol, ignoreCase: true, out var protocol))
        {
            config.SecurityProtocol = protocol;
        }

        if (!string.IsNullOrWhiteSpace(options.SaslMechanism)
            && Enum.TryParse<SaslMechanism>(options.SaslMechanism, ignoreCase: true, out var mechanism))
        {
            config.SaslMechanism = mechanism;
            config.SaslUsername = options.SaslUsername;
            config.SaslPassword = options.SaslPassword;
        }

        return config;
    }

    private static IConsumer<byte[], byte[]> BuildConsumer(KafkaOptions options)
    {
        var config = new ConsumerConfig(BuildClientConfig(options))
        {
            GroupId = $"payment-order-ops-inspector-{Guid.NewGuid():N}",
            EnableAutoCommit = false,
            EnablePartitionEof = true,
            AutoOffsetReset = AutoOffsetReset.Error,
            SessionTimeoutMs = 10_000,
        };

        return new ConsumerBuilder<byte[], byte[]>(config).Build();
    }

    private static async Task<T> Run<T>(KafkaOptions options, Func<IAdminClient, Task<T>> action)
    {
        using var admin = new AdminClientBuilder(new AdminClientConfig(BuildClientConfig(options))).Build();
        try
        {
            return await action(admin);
        }
        catch (KafkaException ex)
        {
            throw new MessageBrokerUnreachableException(MessageBrokerKind.Kafka, ex.Message, ex);
        }
    }

    private static Task<T> Run<T>(KafkaOptions options, Func<IAdminClient, T> action) =>
        Run(options, admin => Task.FromResult(action(admin)));
}
