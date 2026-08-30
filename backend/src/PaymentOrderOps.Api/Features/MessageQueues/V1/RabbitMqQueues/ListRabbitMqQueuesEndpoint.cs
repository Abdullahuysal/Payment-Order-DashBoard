using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.RabbitMqQueues;

internal static class ListRabbitMqQueuesEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("rabbitmq/queues", HandleAsync)
            .WithName("ListRabbitMqQueues")
            .WithSummary("Lists RabbitMQ queues with depth, consumers, rates, dead-letter flags and computed categories.");

    private static async Task<Results<Ok<PagedResponse<RabbitMqQueueResponse>>, ValidationProblem>> HandleAsync(
        MessageBrokerResolver resolver,
        QueueScopeResolver scope,
        IRabbitMqManagementClient rabbit,
        string? nameContains,
        string[]? nameMatches,
        bool? scoped,
        string[]? category,
        bool? onlyProblems,
        bool? deadLetterOnly,
        int? page,
        int? pageSize,
        CancellationToken ct)
    {
        if (category is { Length: > 0 })
        {
            var unknown = category.Where(c => !QueueCategories.IsKnown(c)).ToArray();
            if (unknown.Length > 0)
            {
                return TypedResults.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["category"] = [$"Unknown category value(s): {string.Join(", ", unknown)}. Allowed: error, skip, backlog."],
                });
            }
        }

        var options = resolver.RequireRabbitMq();
        var threshold = options.BacklogReadyThreshold;
        var patterns = await scope.EffectivePatternsAsync(nameMatches, scoped == true, ct);

        IEnumerable<RabbitMqQueue> filtered = await rabbit.ListQueuesAsync(options, ct);

        if (!string.IsNullOrWhiteSpace(nameContains))
        {
            filtered = filtered.Where(q => q.Name.Contains(nameContains, StringComparison.OrdinalIgnoreCase));
        }

        if (patterns.Count > 0)
        {
            filtered = filtered.Where(q => GlobPattern.MatchesAnyLoose(q.Name, patterns));
        }

        if (deadLetterOnly == true)
        {
            filtered = filtered.Where(q => q.IsDeadLetter);
        }

        if (category is { Length: > 0 })
        {
            var wanted = category.ToHashSet(StringComparer.OrdinalIgnoreCase);
            filtered = filtered.Where(q => QueueCategories.For(q, threshold).Any(wanted.Contains));
        }

        if (onlyProblems == true)
        {
            filtered = filtered.Where(IsProblem);
        }

        IReadOnlyList<RabbitMqQueueResponse> mapped =
        [
            .. filtered
                .OrderByDescending(q => q.Messages)
                .ThenBy(q => q.Name, StringComparer.Ordinal)
                .Select(q => q.ToResponse(threshold)),
        ];

        return TypedResults.Ok(mapped.ToPage(page, pageSize));
    }

    private static bool IsProblem(RabbitMqQueue queue) =>
        (queue.Consumers == 0 && queue.MessagesReady > 0)
        || (queue.IsDeadLetter && queue.Messages > 0)
        || queue.State is not ("running" or "idle");
}
