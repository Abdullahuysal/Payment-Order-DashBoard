using System.Text.Json.Nodes;

namespace PaymentOrderOps.Domain.TestRuns;

/// <summary>A single form field the caller fills in before starting a run.</summary>
public sealed record InputField
{
    public required string Name { get; init; }

    public required string Label { get; init; }

    public required InputFieldType Type { get; init; }

    public bool Required { get; init; }

    public IReadOnlyList<InputOption>? Options { get; init; }

    public string? Placeholder { get; init; }

    public string? Help { get; init; }

    public JsonNode? DefaultValue { get; init; }
}

public sealed record InputOption(string Value, string Label);
