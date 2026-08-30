using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Domain.Messaging;
using PaymentOrderOps.Infrastructure.Messaging;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Alerts;

/// <summary>Computed, severity-ranked problem list across both brokers; never fails because one broker is down.</summary>
internal static class ListQueueAlertsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("alerts", HandleAsync)
            .WithName("ListQueueAlerts")
            .WithSummary("Derives actionable alerts: consumerless backlogs, non-empty dead-letters, consumer-group lag, unreachable or degraded brokers.");

    private static async Task<Ok<IReadOnlyList<QueueAlertResponse>>> HandleAsync(
        MessageBrokerResolver resolver,
        QueueScopeResolver scope,
        IRabbitMqManagementClient rabbit,
        IKafkaAdminGateway kafka,
        string[]? nameMatches,
        bool? scoped,
        CancellationToken ct)
    {
        var alerts = new List<QueueAlertResponse>();

        await EvaluateRabbitAsync(resolver, rabbit, alerts, ct);
        await EvaluateKafkaAsync(resolver, kafka, alerts, ct);

        var patterns = await scope.EffectivePatternsAsync(nameMatches, scoped == true, ct);
        IEnumerable<QueueAlertResponse> scopedAlerts = patterns.Count == 0
            ? alerts
            : alerts.Where(a => GlobPattern.MatchesAnyLoose(a.Resource, patterns));

        IReadOnlyList<QueueAlertResponse> ordered =
        [
            .. scopedAlerts
                .OrderByDescending(a => a.Severity)
                .ThenBy(a => a.Broker, StringComparer.Ordinal)
                .ThenBy(a => a.Resource, StringComparer.Ordinal),
        ];

        return TypedResults.Ok(ordered);
    }

    private static async Task EvaluateRabbitAsync(
        MessageBrokerResolver resolver, IRabbitMqManagementClient rabbit, List<QueueAlertResponse> alerts, CancellationToken ct)
    {
        var options = resolver.RabbitMq;
        if (options is null)
        {
            return;
        }

        try
        {
            var health = await rabbit.GetHealthAsync(options, ct);
            foreach (var node in health.Nodes.Where(n => n.MemoryAlarm || n.DiskAlarm || !n.Running))
            {
                alerts.Add(new QueueAlertResponse(
                    QueueAlertSeverity.Critical, "rabbitmq", node.Node, "node",
                    node.Running ? "Resource alarm in effect (memory or disk)." : "Node is not running.", null));
            }

            foreach (var queue in await rabbit.ListQueuesAsync(options, ct))
            {
                if (queue.Consumers == 0 && queue.MessagesReady > 0)
                {
                    alerts.Add(new QueueAlertResponse(
                        queue.MessagesReady >= 1_000 ? QueueAlertSeverity.Critical : QueueAlertSeverity.Warning,
                        "rabbitmq", queue.Name, "queue",
                        $"{queue.MessagesReady} messages ready with no consumers.", queue.MessagesReady));
                }

                if (queue.IsDeadLetter && queue.Messages > 0)
                {
                    alerts.Add(new QueueAlertResponse(
                        queue.Messages >= 100 ? QueueAlertSeverity.Critical : QueueAlertSeverity.Warning,
                        "rabbitmq", queue.Name, "dead-letter-queue",
                        $"{queue.Messages} dead-lettered messages.", queue.Messages));
                }

                if (queue.State is not ("running" or "idle"))
                {
                    alerts.Add(new QueueAlertResponse(
                        QueueAlertSeverity.Warning, "rabbitmq", queue.Name, "queue", $"Queue state is '{queue.State}'.", null));
                }
            }
        }
        catch (MessageBrokerUnreachableException ex)
        {
            alerts.Add(new QueueAlertResponse(
                QueueAlertSeverity.Critical, "rabbitmq", resolver.EnvironmentName, "broker", ex.Message, null));
        }
    }

    private static async Task EvaluateKafkaAsync(
        MessageBrokerResolver resolver, IKafkaAdminGateway kafka, List<QueueAlertResponse> alerts, CancellationToken ct)
    {
        var options = resolver.Kafka;
        if (options is null)
        {
            return;
        }

        try
        {
            var cluster = await kafka.GetClusterInfoAsync(options, ct);
            if (cluster.UnderReplicatedPartitions > 0)
            {
                alerts.Add(new QueueAlertResponse(
                    QueueAlertSeverity.Critical, "kafka", "cluster", "cluster",
                    $"{cluster.UnderReplicatedPartitions} under-replicated partitions.", cluster.UnderReplicatedPartitions));
            }

            foreach (var group in await kafka.ListConsumerGroupsAsync(options, ct))
            {
                if (group.TotalLag >= options.ConsumerGroupLagCriticalThreshold)
                {
                    alerts.Add(new QueueAlertResponse(
                        QueueAlertSeverity.Critical, "kafka", group.GroupId, "consumer-group",
                        $"Total lag {group.TotalLag} (>= {options.ConsumerGroupLagCriticalThreshold}).", group.TotalLag));
                }
                else if (group.TotalLag >= options.ConsumerGroupLagWarningThreshold)
                {
                    alerts.Add(new QueueAlertResponse(
                        QueueAlertSeverity.Warning, "kafka", group.GroupId, "consumer-group",
                        $"Total lag {group.TotalLag} (>= {options.ConsumerGroupLagWarningThreshold}).", group.TotalLag));
                }

                if (group.MemberCount == 0 && group.TotalLag > 0)
                {
                    alerts.Add(new QueueAlertResponse(
                        QueueAlertSeverity.Warning, "kafka", group.GroupId, "consumer-group",
                        $"No active members but {group.TotalLag} messages of lag.", group.TotalLag));
                }
            }
        }
        catch (MessageBrokerUnreachableException ex)
        {
            alerts.Add(new QueueAlertResponse(
                QueueAlertSeverity.Critical, "kafka", resolver.EnvironmentName, "broker", ex.Message, null));
        }
    }
}
