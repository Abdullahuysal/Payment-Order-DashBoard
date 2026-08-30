using System.Text.Json.Nodes;

namespace PaymentOrderOps.Domain.TestRuns;

/// <summary>
/// A single comparison a step or poll loop evaluates. Exactly one selector
/// (<see cref="Path"/> / <see cref="JsonPath"/> / <see cref="Xpath"/> / <see cref="Column"/>)
/// identifies the value; <see cref="Op"/> compares it against <see cref="Value"/>.
/// </summary>
public sealed record Assertion
{
    public string? Path { get; init; }

    public string? JsonPath { get; init; }

    public string? Xpath { get; init; }

    public string? Column { get; init; }

    public required AssertionOp Op { get; init; }

    public JsonNode? Value { get; init; }
}
