using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.KafkaTopics;

internal static class ListKafkaTopicsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("kafka/topics", HandleAsync)
            .WithName("ListKafkaTopics")
            .WithSummary("Lists Kafka topics with partition counts, replication and dead-letter flags (message counts via the detail endpoint).");

    private static async Task<Ok<PagedResponse<KafkaTopicResponse>>> HandleAsync(
        MessageBrokerResolver resolver,
        QueueScopeResolver scope,
        IKafkaAdminGateway kafka,
        string? nameContains,
        string[]? nameMatches,
        bool? scoped,
        bool? includeInternal,
        bool? deadLetterOnly,
        bool? onlyProblems,
        int? page,
        int? pageSize,
        CancellationToken ct)
    {
        var patterns = await scope.EffectivePatternsAsync(nameMatches, scoped == true, ct);

        IEnumerable<KafkaTopic> filtered = await kafka.ListTopicsAsync(resolver.RequireKafka(), ct);

        if (includeInternal != true)
        {
            filtered = filtered.Where(t => !t.IsInternal);
        }

        if (!string.IsNullOrWhiteSpace(nameContains))
        {
            filtered = filtered.Where(t => t.Name.Contains(nameContains, StringComparison.OrdinalIgnoreCase));
        }

        if (patterns.Count > 0)
        {
            filtered = filtered.Where(t => GlobPattern.MatchesAnyLoose(t.Name, patterns));
        }

        if (deadLetterOnly == true)
        {
            filtered = filtered.Where(t => t.IsDeadLetter);
        }

        if (onlyProblems == true)
        {
            filtered = filtered.Where(t => t.UnderReplicatedPartitions > 0);
        }

        IReadOnlyList<KafkaTopicResponse> mapped =
        [
            .. filtered
                .OrderBy(t => t.Name, StringComparer.Ordinal)
                .Select(t => t.ToResponse()),
        ];

        return TypedResults.Ok(mapped.ToPage(page, pageSize));
    }
}
