using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.RabbitMqQueues;

internal static class GetRabbitMqQueueEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("rabbitmq/queues/{vhost}/{name}", HandleAsync)
            .WithName("GetRabbitMqQueue")
            .WithSummary("Gets one RabbitMQ queue including its arguments, dead-letter routing and bindings.");

    private static async Task<Results<Ok<RabbitMqQueueDetailResponse>, NotFound>> HandleAsync(
        string vhost,
        string name,
        MessageBrokerResolver resolver,
        IRabbitMqManagementClient rabbit,
        CancellationToken ct)
    {
        var options = resolver.RequireRabbitMq();
        var detail = await rabbit.GetQueueAsync(options, Uri.UnescapeDataString(vhost), name, ct);
        return detail is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(detail.ToResponse(options.BacklogReadyThreshold));
    }
}
