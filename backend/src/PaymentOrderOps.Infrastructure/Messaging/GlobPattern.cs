using System.Text.RegularExpressions;

namespace PaymentOrderOps.Infrastructure.Messaging;

/// <summary>Case-insensitive <c>*</c> / <c>?</c> glob matching for dead-letter name patterns.</summary>
public static class GlobPattern
{
    public static bool MatchesAny(string value, IReadOnlyCollection<string> patterns)
    {
        foreach (var pattern in patterns)
        {
            if (Matches(value, pattern))
            {
                return true;
            }
        }

        return false;
    }

    public static bool Matches(string value, string pattern)
    {
        if (string.IsNullOrEmpty(pattern))
        {
            return false;
        }

        var regex = "^" + Regex.Escape(pattern).Replace("\\*", ".*", StringComparison.Ordinal)
            .Replace("\\?", ".", StringComparison.Ordinal) + "$";
        return Regex.IsMatch(value, regex, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    /// <summary>
    /// Loose name-scope matching: a pattern containing <c>*</c> is an anchored glob (<c>*</c> =
    /// any run of characters, everything else literal); a pattern with no <c>*</c> is treated as
    /// "contains". Always case-insensitive; blank patterns never match.
    /// </summary>
    public static bool MatchesLoose(string value, string pattern)
    {
        if (string.IsNullOrWhiteSpace(pattern))
        {
            return false;
        }

        if (!pattern.Contains('*', StringComparison.Ordinal))
        {
            return value.Contains(pattern, StringComparison.OrdinalIgnoreCase);
        }

        var regex = "^" + Regex.Escape(pattern).Replace("\\*", ".*", StringComparison.Ordinal) + "$";
        return Regex.IsMatch(value, regex, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    public static bool MatchesAnyLoose(string value, IEnumerable<string> patterns)
    {
        foreach (var pattern in patterns)
        {
            if (MatchesLoose(value, pattern))
            {
                return true;
            }
        }

        return false;
    }
}
