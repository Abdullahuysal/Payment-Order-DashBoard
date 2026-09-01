using System.Text.RegularExpressions;

namespace PaymentOrderOps.Infrastructure.Logs;

/// <summary>
/// Two-stage masking applied to every hit before it leaves <see cref="ILogSearchGateway"/>:
/// (1) any source field whose dotted name is listed in <see cref="ElasticsearchOptions.RedactFields"/>
/// is replaced wholesale with <see cref="Mask"/>; (2) a general pass rewrites secret-looking
/// substrings (bearer tokens, <c>api_key=…</c>, <c>password=…</c>, long hex/base64 blobs) in any
/// remaining string value.
/// </summary>
public static partial class LogRedaction
{
    public const string Mask = "***";

    public static IReadOnlyDictionary<string, string> ApplyToFields(
        IReadOnlyDictionary<string, string> fields, IEnumerable<string> redactFields)
    {
        var named = new HashSet<string>(
            redactFields.Where(f => !string.IsNullOrWhiteSpace(f)).Select(f => f.Trim()),
            StringComparer.OrdinalIgnoreCase);

        var result = new Dictionary<string, string>(fields.Count, StringComparer.Ordinal);
        foreach (var (key, value) in fields)
        {
            result[key] = named.Contains(key) ? Mask : MaskSecrets(value) ?? string.Empty;
        }

        return result;
    }

    public static bool IsRedacted(string fieldName, IEnumerable<string> redactFields) =>
        redactFields.Any(f => !string.IsNullOrWhiteSpace(f)
            && string.Equals(f.Trim(), fieldName, StringComparison.OrdinalIgnoreCase));

    public static string? MaskSecrets(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return value;
        }

        var result = BearerPattern().Replace(value, $"Bearer {Mask}");
        result = KeyValuePattern().Replace(result, $"$1={Mask}");
        result = LongBlobPattern().Replace(result, Mask);
        return result;
    }

    [GeneratedRegex(@"(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*")]
    private static partial Regex BearerPattern();

    [GeneratedRegex(@"(?i)\b(api[_-]?key|apikey|password|passwd|pwd|secret|client[_-]?secret|access[_-]?token|refresh[_-]?token|authorization)\b\s*[=:]\s*[^\s""',;&]+")]
    private static partial Regex KeyValuePattern();

    [GeneratedRegex(@"\b(?:[A-Za-z0-9+/]{40,}={0,2}|[0-9a-fA-F]{64,})\b")]
    private static partial Regex LongBlobPattern();
}
