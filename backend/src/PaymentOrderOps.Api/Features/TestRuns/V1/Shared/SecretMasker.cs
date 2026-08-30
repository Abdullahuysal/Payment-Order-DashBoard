using System.Text.Json.Nodes;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>
/// Redacts secrets from a step's request / response <b>before</b> it is persisted or logged:
/// values under a known sensitive header name, plus any configured secret literal found
/// anywhere in a string, become <c>***</c>. Built per run so the runner can add the tokens it
/// resolved for that run.
/// </summary>
public sealed class SecretMasker
{
    public const string Mask = "***";

    private static readonly string[] DefaultHeaderNames =
    [
        "authorization", "proxy-authorization", "apikey", "api-key", "x-api-key",
        "x-auth-token", "x-auth", "cookie", "set-cookie", "x-access-token",
    ];

    private readonly HashSet<string> _headerNames;
    private readonly List<string> _secretValues;

    public SecretMasker(IEnumerable<string>? extraHeaderNames = null, IEnumerable<string>? secretValues = null)
    {
        _headerNames = new HashSet<string>(DefaultHeaderNames, StringComparer.OrdinalIgnoreCase);
        foreach (var name in extraHeaderNames ?? [])
        {
            if (!string.IsNullOrWhiteSpace(name))
            {
                _headerNames.Add(name.Trim());
            }
        }

        _secretValues = [.. (secretValues ?? [])
            .Where(value => !string.IsNullOrWhiteSpace(value) && value.Trim().Length >= 4)
            .Select(value => value.Trim())
            .Distinct(StringComparer.Ordinal)];
    }

    public SecretMasker With(params string?[] secretValues)
    {
        var merged = _secretValues.Concat(secretValues.Where(v => v is not null).Select(v => v!));
        return new SecretMasker(_headerNames, merged);
    }

    public JsonNode? Redact(JsonNode? node) => Walk(node?.DeepClone());

    public string MaskText(string? text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return text ?? string.Empty;
        }

        var result = text;
        foreach (var secret in _secretValues)
        {
            result = result.Replace(secret, Mask, StringComparison.Ordinal);
        }

        return result;
    }

    private JsonNode? Walk(JsonNode? node)
    {
        switch (node)
        {
            case null:
                return null;
            case JsonObject obj:
            {
                var result = new JsonObject();
                foreach (var (key, child) in obj)
                {
                    result[key] = _headerNames.Contains(key) ? JsonValue.Create(Mask) : Walk(child);
                }

                return result;
            }

            case JsonArray array:
            {
                var result = new JsonArray();
                foreach (var child in array)
                {
                    result.Add(Walk(child));
                }

                return result;
            }

            case JsonValue value when value.TryGetValue<string>(out var text):
                return JsonValue.Create(MaskText(text));
            default:
                return node.DeepClone();
        }
    }
}
