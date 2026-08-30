using System.Globalization;
using System.Text.Json.Nodes;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

public sealed record AssertionContext
{
    public JsonNode? Json { get; init; }

    public string? Xml { get; init; }

    public IReadOnlyDictionary<string, object?>? Row { get; init; }

    public static AssertionContext ForJson(JsonNode? json) => new() { Json = json };

    public static AssertionContext ForXml(string xml) => new() { Xml = xml };

    public static AssertionContext ForRow(IReadOnlyDictionary<string, object?>? row) => new() { Row = row };
}

public sealed record AssertionResult(bool Passed, string Detail);

/// <summary>
/// Evaluates an <see cref="Assertion"/> against a JSON body, a SOAP XML string or a DB row.
/// The selector (<c>path</c> / <c>jsonPath</c> / <c>xpath</c> / <c>column</c>) picks the actual
/// value; <see cref="AssertionOp"/> compares it against <see cref="Assertion.Value"/> with
/// numeric / boolean coercion where both sides parse.
/// </summary>
public static class AssertionEvaluator
{
    public static AssertionResult Evaluate(Assertion assertion, AssertionContext context)
    {
        var (found, actual) = Resolve(assertion, context);
        var selector = Selector(assertion);

        if (assertion.Op == AssertionOp.Exists)
        {
            return new AssertionResult(found, found
                ? $"{selector} exists"
                : $"{selector} does not exist");
        }

        if (!found)
        {
            return new AssertionResult(false, $"{selector} not found for op '{assertion.Op}'");
        }

        var expected = assertion.Value;
        var passed = assertion.Op switch
        {
            AssertionOp.Equals => ValuesEqual(actual, expected),
            AssertionOp.NotEquals => !ValuesEqual(actual, expected),
            AssertionOp.Contains => AsText(actual).Contains(AsText(expected), StringComparison.OrdinalIgnoreCase),
            AssertionOp.Gt => TryNumbers(actual, expected, out var a1, out var e1) && a1 > e1,
            AssertionOp.Lt => TryNumbers(actual, expected, out var a2, out var e2) && a2 < e2,
            _ => false,
        };

        return new AssertionResult(
            passed,
            $"{selector} {assertion.Op} expected '{AsText(expected)}', actual '{AsText(actual)}'");
    }

    private static (bool Found, JsonNode? Value) Resolve(Assertion assertion, AssertionContext context)
    {
        if (!string.IsNullOrWhiteSpace(assertion.Column))
        {
            if (context.Row is null || !context.Row.TryGetValue(assertion.Column, out var raw) || raw is null or DBNull)
            {
                return (false, null);
            }

            return (true, ToNode(raw));
        }

        if (!string.IsNullOrWhiteSpace(assertion.Xpath))
        {
            var value = context.Xml is null ? null : XmlPathReader.SelectValue(context.Xml, assertion.Xpath);
            return value is null ? (false, null) : (true, JsonValue.Create(value));
        }

        var path = assertion.JsonPath ?? assertion.Path;
        var node = JsonPathEvaluator.Evaluate(context.Json, path);
        return node is null ? (false, null) : (true, node);
    }

    private static string Selector(Assertion assertion) =>
        assertion.Column is { Length: > 0 } column ? $"column '{column}'"
        : assertion.Xpath is { Length: > 0 } xpath ? $"xpath '{xpath}'"
        : $"path '{assertion.JsonPath ?? assertion.Path ?? "$"}'";

    private static bool ValuesEqual(JsonNode? actual, JsonNode? expected)
    {
        if (TryNumbers(actual, expected, out var a, out var e))
        {
            return a == e;
        }

        if (TryBooleans(actual, expected, out var ab, out var eb))
        {
            return ab == eb;
        }

        return string.Equals(AsText(actual), AsText(expected), StringComparison.Ordinal);
    }

    private static bool TryNumbers(JsonNode? left, JsonNode? right, out decimal a, out decimal b)
    {
        a = 0;
        b = 0;
        return decimal.TryParse(AsText(left), NumberStyles.Any, CultureInfo.InvariantCulture, out a)
            && decimal.TryParse(AsText(right), NumberStyles.Any, CultureInfo.InvariantCulture, out b);
    }

    private static bool TryBooleans(JsonNode? left, JsonNode? right, out bool a, out bool b) =>
        bool.TryParse(AsText(left), out a) & bool.TryParse(AsText(right), out b);

    private static string AsText(JsonNode? node) => node switch
    {
        null => string.Empty,
        JsonValue value => value.ToString(),
        _ => node.ToJsonString(),
    };

    private static JsonNode? ToNode(object value) => value switch
    {
        bool b => JsonValue.Create(b),
        int or long or short or byte => JsonValue.Create(Convert.ToInt64(value, CultureInfo.InvariantCulture)),
        float or double or decimal => JsonValue.Create(Convert.ToDecimal(value, CultureInfo.InvariantCulture)),
        DateTime dt => JsonValue.Create(dt.ToString("O", CultureInfo.InvariantCulture)),
        _ => JsonValue.Create(Convert.ToString(value, CultureInfo.InvariantCulture)),
    };
}
