namespace PaymentOrderOps.Domain.TestRuns;

/// <summary>
/// A reusable end-to-end test flow. Global (not scoped to an environment); its
/// <see cref="Inputs"/> and <see cref="Steps"/> are stored as <c>jsonb</c>.
/// </summary>
public sealed class TestScenario
{
    public const int KeyMaxLength = 80;
    public const int NameMaxLength = 160;

    private TestScenario()
    {
        Key = string.Empty;
        Name = string.Empty;
        Description = string.Empty;
        Inputs = [];
        Steps = [];
    }

    public TestScenario(
        Guid id,
        string key,
        string name,
        string description,
        TestScenarioKind kind,
        IEnumerable<InputField> inputs,
        IEnumerable<ScenarioStep> steps,
        bool supportsRepeat)
    {
        Id = id;
        Key = key.Trim();
        Name = name.Trim();
        Description = description.Trim();
        Kind = kind;
        Inputs = [.. inputs];
        Steps = [.. steps];
        SupportsRepeat = supportsRepeat;
    }

    public Guid Id { get; private set; }

    public string Key { get; private set; }

    public string Name { get; private set; }

    public string Description { get; private set; }

    public TestScenarioKind Kind { get; private set; }

    public List<InputField> Inputs { get; private set; }

    public List<ScenarioStep> Steps { get; private set; }

    public bool SupportsRepeat { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }
}
