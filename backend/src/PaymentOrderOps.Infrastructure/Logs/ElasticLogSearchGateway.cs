using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace PaymentOrderOps.Infrastructure.Logs;

/// <summary>
/// <see cref="ILogSearchGateway"/> over the Elasticsearch HTTP API. One <see cref="HttpClient"/>
/// is cached per connection (URL + credentials); each call passes its own
/// <see cref="ElasticsearchOptions"/>. Any transport-level failure is surfaced as
/// <see cref="LogSearchUnreachableException"/>.
/// </summary>
public sealed class ElasticLogSearchGateway : ILogSearchGateway, IDisposable
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly ConcurrentDictionary<string, HttpClient> _clients = new(StringComparer.Ordinal);

    public void Dispose()
    {
        foreach (var client in _clients.Values)
        {
            client.Dispose();
        }
    }

    public async Task<LogSearchResult> SearchAsync(
        ElasticsearchOptions options, LogSearchQuery query, CancellationToken ct)
    {
        var fields = LogFieldMap.EcsDefault.With(options.FieldMap);
        var size = Math.Clamp(query.PageSize, 1, Math.Max(1, options.MaxPageSize));
        var from = Math.Max(0, (query.Page - 1) * size);

        var body = new Dictionary<string, object?>
        {
            ["from"] = from,
            ["size"] = size,
            ["track_total_hits"] = true,
            ["sort"] = new object[] { new Dictionary<string, object?> { [fields[LogFieldMap.Timestamp]] = new { order = "desc" } } },
            ["query"] = BuildBoolQuery(fields, query),
            ["aggs"] = new Dictionary<string, object?>
            {
                ["levels"] = Terms(fields[LogFieldMap.Level]),
                ["services"] = Terms(fields[LogFieldMap.Service]),
            },
        };

        using var response = await SendAsync(options, HttpMethod.Post, $"{Index(options)}/_search", body, ct);
        await EnsureSuccessAsync(response);
        using var payload = await ReadJsonAsync(response, ct);
        var root = payload.RootElement;

        var entries = new List<LogEntry>();
        if (root.TryGetProperty("hits", out var hits) && hits.TryGetProperty("hits", out var hitArray))
        {
            entries.AddRange(hitArray.EnumerateArray().Select(hit => Normalize(hit, fields, options.RedactFields)));
        }

        return new LogSearchResult(
            entries,
            ReadTotal(root),
            ReadBucket(root, "levels"),
            ReadBucket(root, "services"));
    }

    public async Task<LogEntry?> GetByIdAsync(ElasticsearchOptions options, string id, CancellationToken ct)
    {
        var fields = LogFieldMap.EcsDefault.With(options.FieldMap);
        var body = new Dictionary<string, object?>
        {
            ["size"] = 1,
            ["query"] = new { ids = new { values = new[] { id } } },
        };

        using var response = await SendAsync(options, HttpMethod.Post, $"{Index(options)}/_search", body, ct);
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        await EnsureSuccessAsync(response);
        using var payload = await ReadJsonAsync(response, ct);

        if (!payload.RootElement.TryGetProperty("hits", out var hits)
            || !hits.TryGetProperty("hits", out var hitArray)
            || hitArray.GetArrayLength() == 0)
        {
            return null;
        }

        return Normalize(hitArray[0], fields, options.RedactFields);
    }

    public async Task<IReadOnlyList<ExceptionGroup>> ListExceptionsAsync(
        ElasticsearchOptions options, DateTimeOffset from, DateTimeOffset to, string? service, CancellationToken ct)
    {
        var fields = LogFieldMap.EcsDefault.With(options.FieldMap);
        var filters = new List<object>
        {
            Range(fields[LogFieldMap.Timestamp], from, to),
            new { exists = new { field = fields[LogFieldMap.ExceptionType] } },
        };

        if (!string.IsNullOrWhiteSpace(service))
        {
            filters.Add(new Dictionary<string, object?> { ["term"] = new Dictionary<string, object?> { [fields[LogFieldMap.Service]] = service.Trim() } });
        }

        var body = new Dictionary<string, object?>
        {
            ["size"] = Math.Max(1, options.ExceptionScanSize),
            ["sort"] = new object[] { new Dictionary<string, object?> { [fields[LogFieldMap.Timestamp]] = new { order = "desc" } } },
            ["query"] = new { @bool = new { filter = filters } },
        };

        using var response = await SendAsync(options, HttpMethod.Post, $"{Index(options)}/_search", body, ct);
        await EnsureSuccessAsync(response);
        using var payload = await ReadJsonAsync(response, ct);

        if (!payload.RootElement.TryGetProperty("hits", out var hits) || !hits.TryGetProperty("hits", out var hitArray))
        {
            return [];
        }

        var groups = new Dictionary<string, ExceptionAccumulator>(StringComparer.Ordinal);
        foreach (var hit in hitArray.EnumerateArray())
        {
            var entry = Normalize(hit, fields, options.RedactFields);
            var topFrame = ExceptionFingerprint.TopFrame(entry.ExceptionStackTrace);
            var type = entry.ExceptionType ?? "UnknownException";
            var message = entry.ExceptionMessage ?? entry.Message ?? string.Empty;
            var fingerprint = ExceptionFingerprint.Compute(type, message, topFrame);

            if (!groups.TryGetValue(fingerprint, out var acc))
            {
                acc = new ExceptionAccumulator(fingerprint, type, message, topFrame);
                groups[fingerprint] = acc;
            }

            acc.Add(entry);
        }

        return [.. groups.Values
            .Select(a => a.ToGroup())
            .OrderByDescending(g => g.Count)
            .ThenByDescending(g => g.LastSeen)];
    }

    private static object BuildBoolQuery(LogFieldMap fields, LogSearchQuery query)
    {
        var filter = new List<object>();
        var must = new List<object>();

        if (query.From is not null || query.To is not null)
        {
            filter.Add(Range(fields[LogFieldMap.Timestamp], query.From, query.To));
        }

        if (!string.IsNullOrWhiteSpace(query.Level))
        {
            filter.Add(Term(fields[LogFieldMap.Level], query.Level.Trim()));
        }

        if (!string.IsNullOrWhiteSpace(query.Service))
        {
            filter.Add(Term(fields[LogFieldMap.Service], query.Service.Trim()));
        }

        if (!string.IsNullOrWhiteSpace(query.TraceId))
        {
            filter.Add(Term(fields[LogFieldMap.TraceId], query.TraceId.Trim()));
        }

        if (!string.IsNullOrWhiteSpace(query.Text))
        {
            must.Add(new
            {
                simple_query_string = new
                {
                    query = query.Text.Trim(),
                    fields = new[] { fields[LogFieldMap.Message], fields[LogFieldMap.ExceptionMessage], fields[LogFieldMap.Logger] },
                    default_operator = "and",
                },
            });
        }

        if (must.Count == 0)
        {
            must.Add(new { match_all = new { } });
        }

        return new { @bool = new { must, filter } };
    }

    private static Dictionary<string, object?> Term(string field, string value) =>
        new() { ["term"] = new Dictionary<string, object?> { [field] = value } };

    private static Dictionary<string, object?> Terms(string field) =>
        new() { ["terms"] = new Dictionary<string, object?> { ["field"] = field, ["size"] = 25 } };

    private static Dictionary<string, object?> Range(string field, DateTimeOffset? from, DateTimeOffset? to)
    {
        var bounds = new Dictionary<string, object?>();
        if (from is not null)
        {
            bounds["gte"] = from.Value.UtcDateTime.ToString("O");
        }

        if (to is not null)
        {
            bounds["lte"] = to.Value.UtcDateTime.ToString("O");
        }

        return new Dictionary<string, object?> { ["range"] = new Dictionary<string, object?> { [field] = bounds } };
    }

    private static string Index(ElasticsearchOptions options) =>
        Uri.EscapeDataString(string.IsNullOrWhiteSpace(options.IndexPattern) ? "logs-*" : options.IndexPattern.Trim());

    private static long ReadTotal(JsonElement root)
    {
        if (!root.TryGetProperty("hits", out var hits) || !hits.TryGetProperty("total", out var total))
        {
            return 0;
        }

        return total.ValueKind switch
        {
            JsonValueKind.Number => total.GetInt64(),
            JsonValueKind.Object when total.TryGetProperty("value", out var value) => value.GetInt64(),
            _ => 0,
        };
    }

    private static IReadOnlyDictionary<string, long> ReadBucket(JsonElement root, string aggName)
    {
        var counts = new Dictionary<string, long>(StringComparer.Ordinal);
        if (root.TryGetProperty("aggregations", out var aggs)
            && aggs.TryGetProperty(aggName, out var agg)
            && agg.TryGetProperty("buckets", out var buckets))
        {
            foreach (var bucket in buckets.EnumerateArray())
            {
                if (bucket.TryGetProperty("key", out var key) && bucket.TryGetProperty("doc_count", out var docCount))
                {
                    counts[key.ToString()] = docCount.GetInt64();
                }
            }
        }

        return counts;
    }

    private static LogEntry Normalize(JsonElement hit, LogFieldMap fields, string[] redactFields)
    {
        var id = hit.TryGetProperty("_id", out var idElement) ? idElement.GetString() ?? string.Empty : string.Empty;
        var source = hit.TryGetProperty("_source", out var src) ? src : default;

        var raw = new Dictionary<string, string>(StringComparer.Ordinal);
        if (source.ValueKind == JsonValueKind.Object)
        {
            Flatten(source, prefix: null, raw);
        }

        var flat = LogRedaction.ApplyToFields(raw, redactFields);

        string? Field(string logical)
        {
            var name = fields[logical];
            return LogRedaction.IsRedacted(name, redactFields)
                ? LogRedaction.Mask
                : LogRedaction.MaskSecrets(ReadPath(source, name));
        }

        return new LogEntry(
            id,
            ParseTimestamp(Field(LogFieldMap.Timestamp)),
            Field(LogFieldMap.Level),
            Field(LogFieldMap.Message),
            Field(LogFieldMap.Service),
            Field(LogFieldMap.TraceId),
            Field(LogFieldMap.SpanId),
            Field(LogFieldMap.Logger),
            Field(LogFieldMap.Host),
            Field(LogFieldMap.ExceptionType),
            Field(LogFieldMap.ExceptionMessage),
            Field(LogFieldMap.ExceptionStackTrace),
            flat);
    }

    private static void Flatten(JsonElement element, string? prefix, IDictionary<string, string> target)
    {
        foreach (var property in element.EnumerateObject())
        {
            var key = prefix is null ? property.Name : $"{prefix}.{property.Name}";
            switch (property.Value.ValueKind)
            {
                case JsonValueKind.Object:
                    Flatten(property.Value, key, target);
                    break;
                case JsonValueKind.Array:
                    target[key] = property.Value.GetRawText();
                    break;
                case JsonValueKind.Null or JsonValueKind.Undefined:
                    break;
                case JsonValueKind.String:
                    target[key] = property.Value.GetString() ?? string.Empty;
                    break;
                default:
                    target[key] = property.Value.GetRawText();
                    break;
            }
        }
    }

    private static string? ReadPath(JsonElement source, string dottedPath)
    {
        if (source.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        if (source.TryGetProperty(dottedPath, out var direct))
        {
            return Stringify(direct);
        }

        var current = source;
        foreach (var segment in dottedPath.Split('.', StringSplitOptions.RemoveEmptyEntries))
        {
            if (current.ValueKind != JsonValueKind.Object || !current.TryGetProperty(segment, out var next))
            {
                return null;
            }

            current = next;
        }

        return Stringify(current);
    }

    private static string? Stringify(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.String => element.GetString(),
        JsonValueKind.Null or JsonValueKind.Undefined => null,
        JsonValueKind.Array => string.Join(", ", element.EnumerateArray().Select(e => e.ToString())),
        _ => element.GetRawText(),
    };

    private static DateTimeOffset? ParseTimestamp(string? raw) =>
        DateTimeOffset.TryParse(raw, System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal,
            out var parsed)
            ? parsed
            : null;

    private HttpClient ClientFor(ElasticsearchOptions options)
    {
        var key = $"{options.Uri}|{options.ApiKey}|{options.Username}|{options.Password}";
        return _clients.GetOrAdd(key, _ =>
        {
            var client = new HttpClient(new SocketsHttpHandler
            {
                PooledConnectionLifetime = TimeSpan.FromMinutes(2),
                AutomaticDecompression = DecompressionMethods.All,
            })
            {
                BaseAddress = new Uri(options.Uri.TrimEnd('/') + "/"),
                Timeout = Timeout.InfiniteTimeSpan,
            };

            if (!string.IsNullOrWhiteSpace(options.ApiKey))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("ApiKey", options.ApiKey.Trim());
            }
            else if (!string.IsNullOrWhiteSpace(options.Username))
            {
                var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{options.Username}:{options.Password}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
            }

            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            return client;
        });
    }

    private async Task<HttpResponseMessage> SendAsync(
        ElasticsearchOptions options, HttpMethod method, string path, object body, CancellationToken ct)
    {
        var client = ClientFor(options);
        using var request = new HttpRequestMessage(method, path) { Content = JsonContent.Create(body, options: Json) };

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, options.RequestTimeoutSeconds)));

        try
        {
            return await client.SendAsync(request, HttpCompletionOption.ResponseContentRead, timeout.Token);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new LogSearchUnreachableException($"the request to '{path}' timed out after {options.RequestTimeoutSeconds}s");
        }
        catch (HttpRequestException ex)
        {
            throw new LogSearchUnreachableException($"HTTP transport error calling '{path}': {ex.Message}", ex);
        }
    }

    private static async Task EnsureSuccessAsync(HttpResponseMessage response)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            throw new LogSearchUnreachableException("authentication with Elasticsearch failed (check ApiKey / Username / Password)");
        }

        var payload = await response.Content.ReadAsStringAsync();
        var detail = payload.Length > 300 ? payload[..300] : payload;
        throw new LogSearchUnreachableException($"Elasticsearch answered {(int)response.StatusCode}: {detail}");
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            return await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        }
        catch (JsonException ex)
        {
            throw new LogSearchUnreachableException($"Elasticsearch returned a malformed response: {ex.Message}", ex);
        }
    }

    private sealed class ExceptionAccumulator(string fingerprint, string type, string sampleMessage, string? topFrame)
    {
        private readonly HashSet<string> _services = new(StringComparer.Ordinal);
        private long _count;
        private DateTimeOffset? _firstSeen;
        private DateTimeOffset? _lastSeen;

        public void Add(LogEntry entry)
        {
            _count++;

            if (!string.IsNullOrWhiteSpace(entry.Service))
            {
                _services.Add(entry.Service);
            }

            if (entry.Timestamp is { } timestamp)
            {
                if (_firstSeen is null || timestamp < _firstSeen)
                {
                    _firstSeen = timestamp;
                }

                if (_lastSeen is null || timestamp > _lastSeen)
                {
                    _lastSeen = timestamp;
                }
            }
        }

        public ExceptionGroup ToGroup() => new(
            fingerprint,
            type,
            sampleMessage,
            topFrame,
            _count,
            _firstSeen,
            _lastSeen,
            [.. _services.OrderBy(s => s, StringComparer.Ordinal)]);
    }
}
