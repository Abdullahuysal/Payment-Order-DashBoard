using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Domain.Logs;

/// <summary>
/// One row per environment holding that environment's saved log queries as a <c>jsonb</c> list
/// (the <see cref="QueueScopeProfile"/> pattern). Last-write-wins upsert.
/// </summary>
public sealed class LogSavedQuery
{
    public const int MaxQueries = 50;
    public const int NameMaxLength = 120;
    public const int FieldMaxLength = 512;

    private LogSavedQuery()
    {
        Queries = [];
    }

    public LogSavedQuery(ServiceEnvironment environment, IEnumerable<LogSavedQueryEntry>? queries)
    {
        Environment = environment;
        Queries = Normalize(queries);
    }

    public ServiceEnvironment Environment { get; private set; }

    public List<LogSavedQueryEntry> Queries { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public void Replace(IEnumerable<LogSavedQueryEntry>? queries) => Queries = Normalize(queries);

    private static List<LogSavedQueryEntry> Normalize(IEnumerable<LogSavedQueryEntry>? queries)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var result = new List<LogSavedQueryEntry>();

        foreach (var entry in queries ?? [])
        {
            var name = entry.Name?.Trim() ?? string.Empty;
            if (name.Length == 0 || !seen.Add(name))
            {
                continue;
            }

            result.Add(entry with
            {
                Name = name,
                Text = Clean(entry.Text),
                Level = Clean(entry.Level),
                Service = Clean(entry.Service),
                TraceId = Clean(entry.TraceId),
            });
        }

        return result;
    }

    private static string? Clean(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }
}

public sealed record LogSavedQueryEntry(
    string Name,
    string? Text,
    string? Level,
    string? Service,
    string? TraceId);
