using System.Globalization;
using System.Text.Json.Nodes;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>
/// Minimal JSONPath: a leading <c>$</c>, dotted property access and <c>[n]</c> array indexes
/// (e.g. <c>$.orders[0].id</c>). No wildcards, filters or recursion. A missing segment yields
/// <c>null</c>.
/// </summary>
public static class JsonPathEvaluator
{
    public static JsonNode? Evaluate(JsonNode? root, string? path)
    {
        if (root is null || string.IsNullOrWhiteSpace(path))
        {
            return root;
        }

        var current = root;
        foreach (var segment in Tokenize(path))
        {
            switch (segment)
            {
                case { Index: { } index } when current is JsonArray array:
                    current = index >= 0 && index < array.Count ? array[index] : null;
                    break;
                case { Name: { } name } when current is JsonObject obj:
                    current = obj.TryGetPropertyValue(name, out var next) ? next : null;
                    break;
                default:
                    return null;
            }

            if (current is null)
            {
                return null;
            }
        }

        return current;
    }

    public static string? AsString(JsonNode? node) => node switch
    {
        null => null,
        JsonValue value => value.ToString(),
        _ => node.ToJsonString(),
    };

    private static IEnumerable<Segment> Tokenize(string path)
    {
        var trimmed = path.TrimStart('$');
        var i = 0;
        while (i < trimmed.Length)
        {
            var c = trimmed[i];
            if (c == '.')
            {
                i++;
                continue;
            }

            if (c == '[')
            {
                var end = trimmed.IndexOf(']', i);
                if (end < 0)
                {
                    yield break;
                }

                var inner = trimmed[(i + 1)..end].Trim().Trim('\'', '"');
                yield return int.TryParse(inner, NumberStyles.Integer, CultureInfo.InvariantCulture, out var index)
                    ? new Segment(null, index)
                    : new Segment(inner, null);
                i = end + 1;
                continue;
            }

            var start = i;
            while (i < trimmed.Length && trimmed[i] != '.' && trimmed[i] != '[')
            {
                i++;
            }

            yield return new Segment(trimmed[start..i], null);
        }
    }

    private readonly record struct Segment(string? Name, int? Index);
}
