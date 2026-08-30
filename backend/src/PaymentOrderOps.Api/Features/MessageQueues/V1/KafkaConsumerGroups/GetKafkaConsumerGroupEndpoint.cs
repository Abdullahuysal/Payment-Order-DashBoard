using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.KafkaConsumerGroups;

internal static class GetKafkaConsumerGroupEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("kafka/consumer-groups/{groupId}", HandleAsync)
            .WithName("GetKafkaConsumerGroup")
            .WithSummary("Gets one consumer group: per-partition committed offset, high watermark, lag and member assignments.");

    private static async Task<Results<Ok<KafkaConsumerGroupDetailResponse>, NotFound>> HandleAsync(
        string groupId,
        MessageBrokerResolver resolver,
        IKafkaAdminGateway kafka,
        CancellationToken ct)
    {
        var detail = await kafka.GetConsumerGroupAsync(resolver.RequireKafka(), groupId, ct);
        return detail is null ? TypedResults.NotFound() : TypedResults.Ok(detail.ToResponse());
    }
}
