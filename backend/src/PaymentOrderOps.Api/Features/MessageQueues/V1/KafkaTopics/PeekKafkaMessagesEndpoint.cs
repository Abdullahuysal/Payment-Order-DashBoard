using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.KafkaTopics;

internal static class PeekKafkaMessagesEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("kafka/topics/{name}/messages", HandleAsync)
            .WithName("PeekKafkaMessages")
            .WithSummary("Reads the tail of a topic (or partition) without committing offsets; surfaces dead-letter headers.");

    private static async Task<Results<Ok<IReadOnlyList<KafkaMessageResponse>>, NotFound>> HandleAsync(
        string name,
        MessageBrokerResolver resolver,
        IKafkaAdminGateway kafka,
        int? partition,
        long? fromOffset,
        int? count,
        CancellationToken ct)
    {
        var messages = await kafka.PeekMessagesAsync(
            resolver.RequireKafka(), name, partition, fromOffset, count ?? 10, ct);

        if (messages is null)
        {
            return TypedResults.NotFound();
        }

        IReadOnlyList<KafkaMessageResponse> mapped = [.. messages.Select(m => m.ToResponse())];
        return TypedResults.Ok(mapped);
    }
}
