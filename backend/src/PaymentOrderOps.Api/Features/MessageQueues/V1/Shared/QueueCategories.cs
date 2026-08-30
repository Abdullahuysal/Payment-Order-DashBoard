using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;

/// <summary>Server-side classification of a RabbitMQ queue into <c>error</c> / <c>skip</c> / <c>backlog</c>.</summary>
internal static class QueueCategories
{
    public const string Error = "error";
    public const string Skip = "skip";
    public const string Backlog = "backlog";

    private static readonly string[] ErrorTokens =
        ["error", "errors", "dlq", "dead-letter", "failed", "failure", "poison"];

    private static readonly string[] SkipTokens =
        ["skip", "skipped", "parked", "quarantine", "hold"];

    public static bool IsKnown(string category) => category is Error or Skip or Backlog;

    public static IReadOnlyList<string> For(RabbitMqQueue queue, long backlogReadyThreshold)
    {
        var categories = new List<string>(3);

        if (queue.IsDeadLetter || ContainsAny(queue.Name, ErrorTokens))
        {
            categories.Add(Error);
        }

        if (ContainsAny(queue.Name, SkipTokens))
        {
            categories.Add(Skip);
        }

        if (queue.MessagesReady > 0 && (queue.Consumers == 0 || queue.MessagesReady >= backlogReadyThreshold))
        {
            categories.Add(Backlog);
        }

        return categories;
    }

    private static bool ContainsAny(string value, string[] tokens)
    {
        foreach (var token in tokens)
        {
            if (value.Contains(token, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
