using System.Text.RegularExpressions;

namespace PaymentOrderOps.Infrastructure.TestRuns;

/// <summary>
/// Pragmatic allow-list for <c>dbQuery</c> statements: a single T-SQL statement that starts
/// with <c>SELECT</c> or <c>WITH</c>, with no statement separator and no data/DDL keyword. Not
/// a full parser — schema validation at write time is the first line of defence.
/// </summary>
public static partial class SqlReadGuard
{
    private static readonly string[] ForbiddenKeywords =
    [
        "INSERT", "UPDATE", "DELETE", "MERGE", "DROP", "ALTER", "CREATE", "TRUNCATE",
        "GRANT", "REVOKE", "EXEC", "EXECUTE", "SP_", "XP_", "INTO", "BULK", "BACKUP",
        "RESTORE", "SHUTDOWN", "RECONFIGURE", "WAITFOR",
    ];

    public static bool IsReadOnly(string sql, out string? reason)
    {
        reason = null;
        if (string.IsNullOrWhiteSpace(sql))
        {
            reason = "The query is empty.";
            return false;
        }

        var stripped = StripComments(sql).Trim().TrimEnd(';').Trim();

        if (stripped.Contains(';', StringComparison.Ordinal))
        {
            reason = "Only a single statement is allowed.";
            return false;
        }

        if (!StartsWithSelectOrCte(stripped))
        {
            reason = "The query must start with SELECT or WITH.";
            return false;
        }

        var tokens = WordBoundary().Split(stripped.ToUpperInvariant());
        foreach (var keyword in ForbiddenKeywords)
        {
            if (Array.Exists(tokens, token => token == keyword)
                || (keyword.EndsWith('_') && Array.Exists(tokens, token => token.StartsWith(keyword, StringComparison.Ordinal))))
            {
                reason = $"The keyword '{keyword}' is not allowed in a read-only query.";
                return false;
            }
        }

        return true;
    }

    private static bool StartsWithSelectOrCte(string sql)
    {
        var head = sql.TrimStart('(').TrimStart();
        return head.StartsWith("SELECT", StringComparison.OrdinalIgnoreCase)
            || head.StartsWith("WITH", StringComparison.OrdinalIgnoreCase);
    }

    private static string StripComments(string sql)
    {
        var noBlock = BlockComment().Replace(sql, " ");
        return LineComment().Replace(noBlock, " ");
    }

    [GeneratedRegex(@"/\*.*?\*/", RegexOptions.Singleline)]
    private static partial Regex BlockComment();

    [GeneratedRegex(@"--[^\r\n]*")]
    private static partial Regex LineComment();

    [GeneratedRegex(@"[^A-Z0-9_]+")]
    private static partial Regex WordBoundary();
}
