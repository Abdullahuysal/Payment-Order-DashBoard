using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.DeadLetters;

/// <summary>Unified DLQ/DLT view across both brokers for the current environment; partial on any broker failure.</summary>
internal static class ListDeadLettersEndpoint
{
    private const int MaxSampledDestinations = 25;

    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("dead-letters", HandleAsync)
            .WithName("ListDeadLetters")
            .WithSummary("Summarises every dead-letter queue (RabbitMQ) and dead-letter topic (Kafka) with counts and a sampled reason.");

    private static async Task<Ok<DeadLetterOverviewResponse>> HandleAsync(
        MessageBrokerResolver resolver,
        QueueScopeResolver scope,
        IRabbitMqManagementClient rabbit,
        IKafkaAdminGateway kafka,
        string[]? nameMatches,
        bool? scoped,
        CancellationToken ct)
    {
        var items = new List<DeadLetterSummaryResponse>();
        var warnings = new List<string>();

        await CollectRabbitAsync(resolver, rabbit, items, warnings, ct);
        await CollectKafkaAsync(resolver, kafka, items, warnings, ct);

        var patterns = await scope.EffectivePatternsAsync(nameMatches, scoped == true, ct);
        var scopedItems = patterns.Count == 0
            ? items
            : items.Where(i => GlobPattern.MatchesAnyLoose(i.Name, patterns)).ToList();

        IReadOnlyList<DeadLetterSummaryResponse> ordered =
        [
            .. scopedItems.OrderByDescending(i => i.MessageCount).ThenBy(i => i.Name, StringComparer.Ordinal),
        ];

        return TypedResults.Ok(new DeadLetterOverviewResponse(
            ordered,
            items.Sum(i => i.MessageCount),
            ordered.Sum(i => i.MessageCount),
            warnings));
    }

    private static async Task CollectRabbitAsync(
        MessageBrokerResolver resolver,
        IRabbitMqManagementClient rabbit,
        List<DeadLetterSummaryResponse> items,
        List<string> warnings,
        CancellationToken ct)
    {
        var options = resolver.RabbitMq;
        if (options is null)
        {
            warnings.Add($"RabbitMQ is not configured for the '{resolver.EnvironmentName}' environment.");
            return;
        }

        try
        {
            var deadLetters = (await rabbit.ListQueuesAsync(options, ct))
                .Where(q => q.IsDeadLetter)
                .OrderByDescending(q => q.Messages)
                .ToList();

            foreach (var queue in deadLetters)
            {
                DateTimeOffset? sampledAt = null;
                string? reason = null;

                if (queue.Messages > 0 && items.Count < MaxSampledDestinations)
                {
                    var sample = await rabbit.PeekMessagesAsync(options, queue.VirtualHost, queue.Name, 1, ct);
                    var death = sample?.FirstOrDefault()?.Deaths.FirstOrDefault();
                    reason = death?.Reason;
                    sampledAt = death?.Time;
                }

                items.Add(new DeadLetterSummaryResponse(
                    "rabbitmq", "queue", queue.Name, queue.Messages, sampledAt, reason));
            }
        }
        catch (MessageBrokerUnreachableException ex)
        {
            warnings.Add($"RabbitMQ could not be fully inspected: {ex.Message}");
        }
    }

    private static async Task CollectKafkaAsync(
        MessageBrokerResolver resolver,
        IKafkaAdminGateway kafka,
        List<DeadLetterSummaryResponse> items,
        List<string> warnings,
        CancellationToken ct)
    {
        var options = resolver.Kafka;
        if (options is null)
        {
            warnings.Add($"Kafka is not configured for the '{resolver.EnvironmentName}' environment.");
            return;
        }

        try
        {
            var deadLetterTopics = (await kafka.ListTopicsAsync(options, ct))
                .Where(t => t.IsDeadLetter)
                .OrderBy(t => t.Name, StringComparer.Ordinal)
                .Take(MaxSampledDestinations)
                .ToList();

            foreach (var topic in deadLetterTopics)
            {
                var detail = await kafka.GetTopicAsync(options, topic.Name, ct);
                var count = detail?.Partitions.Sum(p => p.MessageCount) ?? 0;

                DateTimeOffset? sampledAt = null;
                string? reason = null;
                if (count > 0)
                {
                    var sample = await kafka.PeekMessagesAsync(options, topic.Name, partition: null, fromOffset: null, 1, ct);
                    var message = sample?.LastOrDefault();
                    if (message is not null)
                    {
                        sampledAt = message.Timestamp;
                        reason = FirstHeader(message.Headers, "kafka_dlt-exception-message", "x-exception-message", "x-original-topic");
                    }
                }

                items.Add(new DeadLetterSummaryResponse("kafka", "topic", topic.Name, count, sampledAt, reason));
            }
        }
        catch (MessageBrokerUnreachableException ex)
        {
            warnings.Add($"Kafka could not be fully inspected: {ex.Message}");
        }
    }

    private static string? FirstHeader(IReadOnlyDictionary<string, string> headers, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (headers.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }
}
