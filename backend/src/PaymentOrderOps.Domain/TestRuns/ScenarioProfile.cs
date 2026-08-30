using System.Text.Json.Nodes;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Domain.TestRuns;

/// <summary>
/// A named, environment-scoped set of input values for a scenario. <see cref="Values"/> is an
/// arbitrary JSON object stored as <c>jsonb</c>; concurrency is guarded by <see cref="Xmin"/>.
/// </summary>
public sealed class ScenarioProfile
{
    public const int NameMaxLength = 120;

    private ScenarioProfile()
    {
        Name = string.Empty;
        NormalizedName = string.Empty;
        Values = new Dictionary<string, JsonNode?>(StringComparer.Ordinal);
    }

    public ScenarioProfile(
        Guid id,
        Guid scenarioId,
        ServiceEnvironment environment,
        string name,
        IEnumerable<KeyValuePair<string, JsonNode?>>? values)
    {
        Id = id;
        ScenarioId = scenarioId;
        Environment = environment;
        Name = name.Trim();
        NormalizedName = NormalizeName(Name);
        Values = ToValueMap(values);
    }

    public Guid Id { get; private set; }

    public Guid ScenarioId { get; private set; }

    public ServiceEnvironment Environment { get; private set; }

    public string Name { get; private set; }

    public string NormalizedName { get; private set; }

    public Dictionary<string, JsonNode?> Values { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public uint Xmin { get; private set; }

    public void Update(string name, IEnumerable<KeyValuePair<string, JsonNode?>>? values)
    {
        Name = name.Trim();
        NormalizedName = NormalizeName(Name);
        Values = ToValueMap(values);
    }

    public static string NormalizeName(string name) => name.Trim().ToLowerInvariant();

    private static Dictionary<string, JsonNode?> ToValueMap(IEnumerable<KeyValuePair<string, JsonNode?>>? values)
    {
        var map = new Dictionary<string, JsonNode?>(StringComparer.Ordinal);
        if (values is null)
        {
            return map;
        }

        foreach (var (key, value) in values)
        {
            if (!string.IsNullOrWhiteSpace(key))
            {
                map[key] = value?.DeepClone();
            }
        }

        return map;
    }
}
