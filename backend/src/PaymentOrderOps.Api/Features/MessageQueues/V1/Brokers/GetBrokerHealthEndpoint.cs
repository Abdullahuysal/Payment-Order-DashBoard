using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Brokers;

internal static class GetBrokerHealthEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("brokers/{broker}/health", HandleAsync)
            .WithName("GetMessageBrokerHealth")
            .WithSummary("Deep health for one broker: RabbitMQ node alarms, or Kafka broker count and under-replicated partitions.");

    private static async Task<Results<Ok<BrokerHealthResponse>, ValidationProblem>> HandleAsync(
        string broker,
        MessageBrokerResolver resolver,
        IRabbitMqManagementClient rabbit,
        IKafkaAdminGateway kafka,
        CancellationToken ct)
    {
        switch (broker.ToLowerInvariant())
        {
            case "rabbitmq":
            {
                var health = await rabbit.GetHealthAsync(resolver.RequireRabbitMq(), ct);
                return TypedResults.Ok(new BrokerHealthResponse("rabbitmq", Reachable: true, null, health.ToDetail(), null));
            }

            case "kafka":
            {
                var cluster = await kafka.GetClusterInfoAsync(resolver.RequireKafka(), ct);
                return TypedResults.Ok(new BrokerHealthResponse("kafka", Reachable: true, null, null, cluster.ToDetail()));
            }

            default:
                return TypedResults.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["broker"] = ["Broker must be 'rabbitmq' or 'kafka'."],
                });
        }
    }
}
