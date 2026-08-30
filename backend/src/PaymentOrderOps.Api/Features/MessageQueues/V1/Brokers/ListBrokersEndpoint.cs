using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Brokers;

internal static class ListBrokersEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("brokers", HandleAsync)
            .WithName("ListMessageBrokers")
            .WithSummary("Lists the brokers configured for the current environment and whether each is reachable.");

    private static async Task<Ok<IReadOnlyList<BrokerSummaryResponse>>> HandleAsync(
        MessageBrokerResolver resolver,
        IRabbitMqManagementClient rabbit,
        IKafkaAdminGateway kafka,
        CancellationToken ct)
    {
        var results = new List<BrokerSummaryResponse>(2)
        {
            await ProbeRabbitAsync(resolver, rabbit, ct),
            await ProbeKafkaAsync(resolver, kafka, ct),
        };

        return TypedResults.Ok<IReadOnlyList<BrokerSummaryResponse>>(results);
    }

    private static async Task<BrokerSummaryResponse> ProbeRabbitAsync(
        MessageBrokerResolver resolver, IRabbitMqManagementClient rabbit, CancellationToken ct)
    {
        var options = resolver.RabbitMq;
        if (options is null)
        {
            return new BrokerSummaryResponse("rabbitmq", Configured: false, Reachable: false, null, null, null);
        }

        try
        {
            var overview = await rabbit.GetOverviewAsync(options, ct);
            return new BrokerSummaryResponse(
                "rabbitmq", Configured: true, Reachable: true,
                overview.RabbitMqVersion,
                $"cluster '{overview.ClusterName}', {overview.TotalQueues} queues, {overview.MessagesReady} ready",
                null);
        }
        catch (MessageBrokerUnreachableException ex)
        {
            return new BrokerSummaryResponse("rabbitmq", Configured: true, Reachable: false, null, null, ex.Message);
        }
    }

    private static async Task<BrokerSummaryResponse> ProbeKafkaAsync(
        MessageBrokerResolver resolver, IKafkaAdminGateway kafka, CancellationToken ct)
    {
        var options = resolver.Kafka;
        if (options is null)
        {
            return new BrokerSummaryResponse("kafka", Configured: false, Reachable: false, null, null, null);
        }

        try
        {
            var cluster = await kafka.GetClusterInfoAsync(options, ct);
            return new BrokerSummaryResponse(
                "kafka", Configured: true, Reachable: true,
                null,
                $"{cluster.Brokers.Count} brokers, {cluster.TopicCount} topics, {cluster.UnderReplicatedPartitions} under-replicated partitions",
                null);
        }
        catch (MessageBrokerUnreachableException ex)
        {
            return new BrokerSummaryResponse("kafka", Configured: true, Reachable: false, null, null, ex.Message);
        }
    }
}
