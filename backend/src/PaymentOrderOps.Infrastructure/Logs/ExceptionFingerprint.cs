using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace PaymentOrderOps.Infrastructure.Logs;

/// <summary>
/// Groups exceptions by <c>sha1(type + '\n' + normalizedMessage + '\n' + topFrame)</c>. The
/// message is normalized first: every number, GUID and ISO-ish date is collapsed to <c>*</c> so
/// that "Order 4821 not found" and "Order 991 not found" land in the same group.
/// </summary>
public static partial class ExceptionFingerprint
{
    public static string Compute(string? exceptionType, string? message, string? topFrame)
    {
        var canonical = string.Join(
            '\n',
            (exceptionType ?? string.Empty).Trim(),
            NormalizeMessage(message),
            (topFrame ?? string.Empty).Trim());

        var hash = SHA1.HashData(Encoding.UTF8.GetBytes(canonical));
        return Convert.ToHexStringLower(hash);
    }

    public static string NormalizeMessage(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return string.Empty;
        }

        var text = message.Trim();
        text = GuidPattern().Replace(text, "*");
        text = DatePattern().Replace(text, "*");
        text = NumberPattern().Replace(text, "*");
        return WhitespacePattern().Replace(text, " ");
    }

    /// <summary>First <c>at &lt;symbol&gt;</c> line of a .NET stack trace, or the first non-empty line.</summary>
    public static string? TopFrame(string? stackTrace)
    {
        if (string.IsNullOrWhiteSpace(stackTrace))
        {
            return null;
        }

        foreach (var raw in stackTrace.Split('\n'))
        {
            var line = raw.Trim();
            if (line.StartsWith("at ", StringComparison.Ordinal))
            {
                return line;
            }
        }

        foreach (var raw in stackTrace.Split('\n'))
        {
            var line = raw.Trim();
            if (line.Length > 0)
            {
                return line;
            }
        }

        return null;
    }

    [GeneratedRegex(@"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b")]
    private static partial Regex GuidPattern();

    [GeneratedRegex(@"\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?")]
    private static partial Regex DatePattern();

    [GeneratedRegex(@"\b\d[\d.,:]*\b")]
    private static partial Regex NumberPattern();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespacePattern();
}
