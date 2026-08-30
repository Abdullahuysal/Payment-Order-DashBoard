using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.RabbitMqQueues;

internal static class PeekRabbitMqMessagesEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("rabbitmq/queues/{vhost}/{name}/messages", HandleAsync)
            .WithName("PeekRabbitMqMessages")
            .WithSummary("Previews messages in a queue without consuming them (ack_requeue_true); surfaces x-death reasons.");

    private static async Task<Results<Ok<IReadOnlyList<RabbitMqMessageResponse>>, NotFound>> HandleAsync(
        string vhost,
        string name,
        MessageBrokerResolver resolver,
        IRabbitMqManagementClient rabbit,
        int? count,
        CancellationToken ct)
    {
        var messages = await rabbit.PeekMessagesAsync(
            resolver.RequireRabbitMq(), Uri.UnescapeDataString(vhost), name, count ?? 10, ct);

        if (messages is null)
        {
            return TypedResults.NotFound();
        }

        IReadOnlyList<RabbitMqMessageResponse> mapped = [.. messages.Select(m => m.ToResponse())];
        return TypedResults.Ok(mapped);
    }
}
