using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Domain.Messaging;

public sealed class QueueScopeProfile
{
    public const int MaxPatterns = 100;
    public const int PatternMaxLength = 256;

    private QueueScopeProfile()
    {
        Patterns = [];
    }

    public QueueScopeProfile(ServiceEnvironment environment, IEnumerable<string>? patterns)
    {
        Environment = environment;
        Patterns = Normalize(patterns);
    }

    public ServiceEnvironment Environment { get; private set; }

    public List<string> Patterns { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public void Replace(IEnumerable<string>? patterns) => Patterns = Normalize(patterns);

    private static List<string> Normalize(IEnumerable<string>? patterns) =>
    [
        .. (patterns ?? [])
            .Select(pattern => pattern.Trim())
            .Where(pattern => pattern.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase),
    ];
}
