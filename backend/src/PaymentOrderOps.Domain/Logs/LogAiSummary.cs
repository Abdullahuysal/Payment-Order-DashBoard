using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Domain.Logs;

/// <summary>
/// A cached AI summary for one <c>(environment, window, filters)</c> tuple. <see cref="Payload"/>
/// holds the serialized <c>AiSummaryResponse</c> as <c>jsonb</c>; the composite key lets a
/// repeated request skip the LLM call unless <c>force</c> is set.
/// </summary>
public sealed class LogAiSummary
{
    public const int FiltersHashLength = 64;

    private LogAiSummary()
    {
        FiltersHash = string.Empty;
        Payload = "{}";
        Model = string.Empty;
    }

    public LogAiSummary(
        ServiceEnvironment environment,
        DateTime windowStartUtc,
        DateTime windowEndUtc,
        string filtersHash,
        string payload,
        string model,
        int groupCount)
    {
        Environment = environment;
        WindowStartUtc = windowStartUtc;
        WindowEndUtc = windowEndUtc;
        FiltersHash = filtersHash;
        Payload = payload;
        Model = model;
        GroupCount = groupCount;
    }

    public ServiceEnvironment Environment { get; private set; }

    public DateTime WindowStartUtc { get; private set; }

    public DateTime WindowEndUtc { get; private set; }

    public string FiltersHash { get; private set; }

    public string Payload { get; private set; }

    public string Model { get; private set; }

    public int GroupCount { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public void Refresh(string payload, string model, int groupCount)
    {
        Payload = payload;
        Model = model;
        GroupCount = groupCount;
    }
}
