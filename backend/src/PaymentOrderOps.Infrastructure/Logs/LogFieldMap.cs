namespace PaymentOrderOps.Infrastructure.Logs;

/// <summary>
/// Maps the normalized <see cref="LogEntry"/> shape onto concrete Elasticsearch source
/// field names. Defaults follow the Elastic Common Schema (ECS); a per-environment
/// <see cref="ElasticsearchOptions.FieldMap"/> overrides individual entries.
/// </summary>
public sealed class LogFieldMap
{
    public static readonly LogFieldMap EcsDefault = new(new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [Timestamp] = "@timestamp",
        [Level] = "log.level",
        [Message] = "message",
        [Service] = "service.name",
        [TraceId] = "trace.id",
        [SpanId] = "span.id",
        [Logger] = "log.logger",
        [Host] = "host.name",
        [ExceptionType] = "error.type",
        [ExceptionMessage] = "error.message",
        [ExceptionStackTrace] = "error.stack_trace",
    });

    public const string Timestamp = nameof(Timestamp);
    public const string Level = nameof(Level);
    public const string Message = nameof(Message);
    public const string Service = nameof(Service);
    public const string TraceId = nameof(TraceId);
    public const string SpanId = nameof(SpanId);
    public const string Logger = nameof(Logger);
    public const string Host = nameof(Host);
    public const string ExceptionType = nameof(ExceptionType);
    public const string ExceptionMessage = nameof(ExceptionMessage);
    public const string ExceptionStackTrace = nameof(ExceptionStackTrace);

    private readonly Dictionary<string, string> _fields;

    private LogFieldMap(Dictionary<string, string> fields) => _fields = fields;

    public string this[string logical] => _fields[logical];

    public IReadOnlyCollection<string> SourceFields => _fields.Values;

    public LogFieldMap With(IReadOnlyDictionary<string, string>? overrides)
    {
        if (overrides is null || overrides.Count == 0)
        {
            return this;
        }

        var merged = new Dictionary<string, string>(_fields, StringComparer.OrdinalIgnoreCase);
        foreach (var (logical, field) in overrides)
        {
            if (merged.ContainsKey(logical) && !string.IsNullOrWhiteSpace(field))
            {
                merged[logical] = field.Trim();
            }
        }

        return new LogFieldMap(merged);
    }
}
