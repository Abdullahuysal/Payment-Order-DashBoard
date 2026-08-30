using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.KafkaConsumerGroups;

internal static class ListKafkaConsumerGroupsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("kafka/consumer-groups", HandleAsync)
            .WithName("ListKafkaConsumerGroups")
            .WithSummary("Lists Kafka consumer groups with state, member count and total lag.");

    private static async Task<Ok<IReadOnlyList<KafkaConsumerGroupResponse>>> HandleAsync(
        MessageBrokerResolver resolver,
        QueueScopeResolver scope,
        IKafkaAdminGateway kafka,
        string? groupContains,
        string[]? nameMatches,
        bool? scoped,
        bool? onlyLagging,
        long? minLag,
        CancellationToken ct)
    {
        var patterns = await scope.EffectivePatternsAsync(nameMatches, scoped == true, ct);

        IEnumerable<KafkaConsumerGroup> filtered = await kafka.ListConsumerGroupsAsync(resolver.RequireKafka(), ct);

        if (!string.IsNullOrWhiteSpace(groupContains))
        {
            filtered = filtered.Where(g => g.GroupId.Contains(groupContains, StringComparison.OrdinalIgnoreCase));
        }

        if (patterns.Count > 0)
        {
            filtered = filtered.Where(g => GlobPattern.MatchesAnyLoose(g.GroupId, patterns));
        }

        if (onlyLagging == true)
        {
            filtered = filtered.Where(g => g.TotalLag > 0);
        }

        if (minLag is { } threshold)
        {
            filtered = filtered.Where(g => g.TotalLag >= threshold);
        }

        IReadOnlyList<KafkaConsumerGroupResponse> mapped =
        [
            .. filtered
                .OrderByDescending(g => g.TotalLag)
                .ThenBy(g => g.GroupId, StringComparer.Ordinal)
                .Select(g => g.ToResponse()),
        ];

        return TypedResults.Ok(mapped);
    }
}
