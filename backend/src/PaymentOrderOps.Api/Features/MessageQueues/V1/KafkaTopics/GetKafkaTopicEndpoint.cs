using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.KafkaTopics;

internal static class GetKafkaTopicEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("kafka/topics/{name}", HandleAsync)
            .WithName("GetKafkaTopic")
            .WithSummary("Gets one Kafka topic with per-partition watermarks, in-sync replicas and message counts.");

    private static async Task<Results<Ok<KafkaTopicDetailResponse>, NotFound>> HandleAsync(
        string name,
        MessageBrokerResolver resolver,
        IKafkaAdminGateway kafka,
        CancellationToken ct)
    {
        var detail = await kafka.GetTopicAsync(resolver.RequireKafka(), name, ct);
        return detail is null ? TypedResults.NotFound() : TypedResults.Ok(detail.ToResponse());
    }
}
