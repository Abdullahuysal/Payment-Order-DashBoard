using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>Raised when a <c>{{var}}</c> placeholder has no value in the run's variable bag.</summary>
public sealed class TemplateBindingException(string variable)
    : Exception($"Template variable '{{{{{variable}}}}}' has no value.")
{
    public string Variable { get; } = variable;
}

/// <summary>
/// Substitutes <c>{{var}}</c> / <c>{{a.b}}</c> placeholders in string fields from the run's
/// variable bag. Host / base URLs never flow through here — steps reference named targets only.
/// A missing variable is a step failure, never a silent blank.
/// </summary>
public static partial class TemplateEngine
{
    [GeneratedRegex(@"\{\{\s*([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\s*\}\}")]
    private static partial Regex Placeholder();

    public static string Render(string template, IReadOnlyDictionary<string, JsonNode?> variables)
    {
        if (string.IsNullOrEmpty(template) || !template.Contains("{{", StringComparison.Ordinal))
        {
            return template;
        }

        return Placeholder().Replace(template, match =>
        {
            var path = match.Groups[1].Value;
            var value = Resolve(path, variables) ?? throw new TemplateBindingException(path);
            return Stringify(value);
        });
    }

    public static JsonNode? Render(JsonNode? node, IReadOnlyDictionary<string, JsonNode?> variables)
    {
        switch (node)
        {
            case null:
                return null;
            case JsonValue value when value.TryGetValue<string>(out var text):
                return RenderScalar(text, variables);
            case JsonObject obj:
            {
                var result = new JsonObject();
                foreach (var (key, child) in obj)
                {
                    result[key] = Render(child, variables);
                }

                return result;
            }

            case JsonArray array:
            {
                var result = new JsonArray();
                foreach (var child in array)
                {
                    result.Add(Render(child, variables));
                }

                return result;
            }

            default:
                return node.DeepClone();
        }
    }

    public static IReadOnlyDictionary<string, string>? Render(
        IReadOnlyDictionary<string, string>? map, IReadOnlyDictionary<string, JsonNode?> variables)
    {
        if (map is null)
        {
            return null;
        }

        var rendered = new Dictionary<string, string>(map.Count, StringComparer.Ordinal);
        foreach (var (key, value) in map)
        {
            rendered[key] = Render(value, variables);
        }

        return rendered;
    }

    private static JsonNode? RenderScalar(string text, IReadOnlyDictionary<string, JsonNode?> variables)
    {
        var trimmed = text.Trim();
        var whole = Placeholder().Match(trimmed);
        if (whole.Success && whole.Value.Length == trimmed.Length)
        {
            var value = Resolve(whole.Groups[1].Value, variables)
                ?? throw new TemplateBindingException(whole.Groups[1].Value);
            return value.DeepClone();
        }

        return JsonValue.Create(Render(text, variables));
    }

    private static JsonNode? Resolve(string path, IReadOnlyDictionary<string, JsonNode?> variables)
    {
        var segments = path.Split('.');
        if (!variables.TryGetValue(segments[0], out var current) || current is null)
        {
            return variables.TryGetValue(path, out var flat) ? flat : null;
        }

        for (var i = 1; i < segments.Length; i++)
        {
            if (current is JsonObject obj && obj.TryGetPropertyValue(segments[i], out var next))
            {
                current = next;
            }
            else
            {
                return null;
            }
        }

        return current;
    }

    private static string Stringify(JsonNode value) =>
        value is JsonValue scalar ? scalar.ToString() : value.ToJsonString();
}
