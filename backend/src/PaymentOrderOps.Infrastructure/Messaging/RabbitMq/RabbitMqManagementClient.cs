using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using PaymentOrderOps.Domain.Messaging;

namespace PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

public interface IRabbitMqManagementClient
{
    Task<RabbitMqOverview> GetOverviewAsync(RabbitMqOptions options, CancellationToken ct);

    Task<RabbitMqHealth> GetHealthAsync(RabbitMqOptions options, CancellationToken ct);

    Task<IReadOnlyList<RabbitMqQueue>> ListQueuesAsync(RabbitMqOptions options, CancellationToken ct);

    Task<RabbitMqQueueDetail?> GetQueueAsync(RabbitMqOptions options, string virtualHost, string name, CancellationToken ct);

    Task<IReadOnlyList<RabbitMqPreviewMessage>?> PeekMessagesAsync(
        RabbitMqOptions options, string virtualHost, string name, int count, CancellationToken ct);
}

public sealed class RabbitMqManagementClient : IRabbitMqManagementClient, IDisposable
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        NumberHandling = JsonNumberHandling.AllowReadingFromString,
    };

    private readonly HttpClient _http = new(new SocketsHttpHandler
    {
        PooledConnectionLifetime = TimeSpan.FromMinutes(2),
        AutomaticDecompression = DecompressionMethods.All,
    });

    public void Dispose() => _http.Dispose();

    public async Task<RabbitMqOverview> GetOverviewAsync(RabbitMqOptions options, CancellationToken ct)
    {
        var overview = await GetAsync<OverviewDto>(options, "api/overview", ct)
            ?? throw Unreachable("the management API returned no overview");
        return Map(overview);
    }

    public async Task<RabbitMqHealth> GetHealthAsync(RabbitMqOptions options, CancellationToken ct)
    {
        var overview = await GetOverviewAsync(options, ct);
        var nodes = await GetAsync<List<NodeDto>>(options, "api/nodes", ct) ?? [];
        var mapped = nodes
            .Select(n => new RabbitMqNodeAlarm(n.Name ?? "unknown", n.MemAlarm, n.DiskFreeAlarm, n.Running))
            .ToList();
        return new RabbitMqHealth(overview, mapped, mapped.Any(n => n.MemoryAlarm || n.DiskAlarm || !n.Running));
    }

    public async Task<IReadOnlyList<RabbitMqQueue>> ListQueuesAsync(RabbitMqOptions options, CancellationToken ct)
    {
        var vhost = Uri.EscapeDataString(options.VirtualHost);
        var queues = await GetAsync<List<QueueDto>>(options, $"api/queues/{vhost}", ct) ?? [];
        return [.. queues.Select(q => MapQueue(q, options))];
    }

    public async Task<RabbitMqQueueDetail?> GetQueueAsync(
        RabbitMqOptions options, string virtualHost, string name, CancellationToken ct)
    {
        var vhost = Uri.EscapeDataString(virtualHost);
        var queue = await GetAsync<QueueDto>(options, $"api/queues/{vhost}/{Uri.EscapeDataString(name)}", ct, allowNotFound: true);
        if (queue is null)
        {
            return null;
        }

        var bindings = await GetAsync<List<BindingDto>>(
            options, $"api/queues/{vhost}/{Uri.EscapeDataString(name)}/bindings", ct) ?? [];

        var arguments = ToStringMap(queue.Arguments);

        arguments.TryGetValue("x-dead-letter-exchange", out var dlx);
        arguments.TryGetValue("x-dead-letter-routing-key", out var dlrk);

        return new RabbitMqQueueDetail(
            MapQueue(queue, options),
            arguments,
            dlx,
            dlrk,
            queue.Memory,
            [.. bindings.Select(b => new RabbitMqBinding(
                b.Source ?? string.Empty, b.RoutingKey ?? string.Empty, b.DestinationType ?? "queue", b.Destination ?? name))]);
    }

    public async Task<IReadOnlyList<RabbitMqPreviewMessage>?> PeekMessagesAsync(
        RabbitMqOptions options, string virtualHost, string name, int count, CancellationToken ct)
    {
        var clamped = Math.Clamp(count, 1, options.MessagePreviewCountLimit);
        var vhost = Uri.EscapeDataString(virtualHost);
        var body = new
        {
            count = clamped,
            ackmode = "ack_requeue_true",
            encoding = "auto",
            truncate = options.MessagePreviewMaxBytes,
        };

        using var response = await SendAsync(
            options, HttpMethod.Post, $"api/queues/{vhost}/{Uri.EscapeDataString(name)}/get", ct, JsonContent.Create(body));

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        await EnsureSuccessAsync(response);
        var messages = await response.Content.ReadFromJsonAsync<List<GetMessageDto>>(Json, ct) ?? [];
        return [.. messages.Select(m => MapMessage(m, options))];
    }

    private async Task<T?> GetAsync<T>(
        RabbitMqOptions options, string path, CancellationToken ct, bool allowNotFound = false)
    {
        using var response = await SendAsync(options, HttpMethod.Get, path, ct, content: null);
        if (allowNotFound && response.StatusCode == HttpStatusCode.NotFound)
        {
            return default;
        }

        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<T>(Json, ct);
    }

    private async Task<HttpResponseMessage> SendAsync(
        RabbitMqOptions options, HttpMethod method, string path, CancellationToken ct, HttpContent? content)
    {
        var baseUrl = options.ManagementUrl.TrimEnd('/');
        using var request = new HttpRequestMessage(method, $"{baseUrl}/{path}") { Content = content };
        var token = Encoding.UTF8.GetBytes($"{options.Username}:{options.Password}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(token));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, options.RequestTimeoutSeconds)));

        try
        {
            return await _http.SendAsync(request, HttpCompletionOption.ResponseContentRead, timeout.Token);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            throw Unreachable($"the request to '{path}' timed out after {options.RequestTimeoutSeconds}s");
        }
        catch (HttpRequestException ex)
        {
            throw Unreachable($"HTTP transport error calling '{path}': {ex.Message}", ex);
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
            throw Unreachable("authentication with the management API failed (check Username / Password)");
        }

        var payload = await response.Content.ReadAsStringAsync();
        var detail = payload.Length > 300 ? payload[..300] : payload;
        throw Unreachable($"the management API answered {(int)response.StatusCode}: {detail}");
    }

    private static MessageBrokerUnreachableException Unreachable(string reason, Exception? inner = null) =>
        new(MessageBrokerKind.RabbitMq, reason, inner);

    private static RabbitMqOverview Map(OverviewDto dto) => new(
        dto.RabbitmqVersion ?? dto.ManagementVersion ?? "unknown",
        dto.ProductVersion,
        dto.ClusterName ?? "unknown",
        dto.Node,
        dto.ObjectTotals?.Queues ?? 0,
        dto.ObjectTotals?.Connections ?? 0,
        dto.ObjectTotals?.Consumers ?? 0,
        dto.QueueTotals?.Messages ?? 0,
        dto.QueueTotals?.MessagesReady ?? 0,
        dto.QueueTotals?.MessagesUnacknowledged ?? 0);

    private static RabbitMqQueue MapQueue(QueueDto dto, RabbitMqOptions options)
    {
        var name = dto.Name ?? string.Empty;
        var hasDlx = dto.Arguments.ValueKind == JsonValueKind.Object
            && dto.Arguments.TryGetProperty("x-dead-letter-exchange", out _);
        var isDlq = GlobPattern.MatchesAny(name, options.DeadLetterQueuePatterns);

        return new RabbitMqQueue(
            name,
            dto.Vhost ?? options.VirtualHost,
            dto.State ?? "unknown",
            dto.Messages,
            dto.MessagesReady,
            dto.MessagesUnacknowledged,
            dto.Consumers,
            dto.MessageStats?.PublishDetails?.Rate ?? 0,
            dto.MessageStats?.DeliverGetDetails?.Rate ?? 0,
            dto.MessageStats?.RedeliverDetails?.Rate ?? 0,
            ParseTimestamp(dto.IdleSince),
            isDlq,
            hasDlx);
    }

    private static RabbitMqPreviewMessage MapMessage(GetMessageDto dto, RabbitMqOptions options)
    {
        var headers = new Dictionary<string, string>(StringComparer.Ordinal);
        var deaths = new List<RabbitMqDeathRecord>();

        if (dto.Properties is { ValueKind: JsonValueKind.Object } properties
            && properties.TryGetProperty("headers", out var rawHeaders)
            && rawHeaders.ValueKind == JsonValueKind.Object)
        {
            foreach (var header in rawHeaders.EnumerateObject())
            {
                if (header.Name == "x-death" && header.Value.ValueKind == JsonValueKind.Array)
                {
                    deaths.AddRange(ParseDeaths(header.Value));
                    continue;
                }

                headers[header.Name] = Stringify(header.Value);
            }
        }

        var payload = dto.Payload ?? string.Empty;
        var truncated = payload.Length >= options.MessagePreviewMaxBytes;

        return new RabbitMqPreviewMessage(
            dto.MessageCount,
            dto.Redelivered,
            dto.Exchange ?? string.Empty,
            dto.RoutingKey ?? string.Empty,
            dto.PayloadBytes,
            payload,
            truncated,
            headers,
            deaths);
    }

    private static IEnumerable<RabbitMqDeathRecord> ParseDeaths(JsonElement array)
    {
        foreach (var entry in array.EnumerateArray())
        {
            if (entry.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var routingKeys = new List<string>();
            if (entry.TryGetProperty("routing-keys", out var rk) && rk.ValueKind == JsonValueKind.Array)
            {
                routingKeys.AddRange(rk.EnumerateArray().Select(x => x.ToString()));
            }

            yield return new RabbitMqDeathRecord(
                GetString(entry, "reason"),
                GetString(entry, "queue"),
                GetString(entry, "exchange"),
                entry.TryGetProperty("count", out var c) && c.TryGetInt64(out var count) ? count : 0,
                entry.TryGetProperty("time", out var t) ? ParseTimestamp(t.ToString()) : null,
                routingKeys);
        }
    }

    private static Dictionary<string, string> ToStringMap(JsonElement element)
    {
        var map = new Dictionary<string, string>(StringComparer.Ordinal);
        if (element.ValueKind != JsonValueKind.Object)
        {
            return map;
        }

        foreach (var property in element.EnumerateObject())
        {
            map[property.Name] = Stringify(property.Value);
        }

        return map;
    }

    private static string GetString(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) ? value.ToString() : string.Empty;

    private static string Stringify(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.String => element.GetString() ?? string.Empty,
        JsonValueKind.Null or JsonValueKind.Undefined => string.Empty,
        _ => element.GetRawText(),
    };

    private static DateTimeOffset? ParseTimestamp(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        if (DateTimeOffset.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var iso))
        {
            return iso;
        }

        if (DateTime.TryParseExact(
                raw, "yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var legacy))
        {
            return new DateTimeOffset(legacy, TimeSpan.Zero);
        }

        if (long.TryParse(raw, out var epochMs))
        {
            return DateTimeOffset.FromUnixTimeMilliseconds(epochMs);
        }

        return null;
    }

    private sealed record OverviewDto(
        [property: JsonPropertyName("rabbitmq_version")] string? RabbitmqVersion,
        [property: JsonPropertyName("management_version")] string? ManagementVersion,
        [property: JsonPropertyName("product_version")] string? ProductVersion,
        [property: JsonPropertyName("cluster_name")] string? ClusterName,
        [property: JsonPropertyName("node")] string? Node,
        [property: JsonPropertyName("object_totals")] ObjectTotalsDto? ObjectTotals,
        [property: JsonPropertyName("queue_totals")] QueueTotalsDto? QueueTotals);

    private sealed record ObjectTotalsDto(int Queues, int Connections, int Consumers);

    private sealed record QueueTotalsDto(
        long Messages,
        [property: JsonPropertyName("messages_ready")] long MessagesReady,
        [property: JsonPropertyName("messages_unacknowledged")] long MessagesUnacknowledged);

    private sealed record NodeDto(
        string? Name,
        [property: JsonPropertyName("mem_alarm")] bool MemAlarm,
        [property: JsonPropertyName("disk_free_alarm")] bool DiskFreeAlarm,
        bool Running);

    private sealed record QueueDto(
        string? Name,
        string? Vhost,
        string? State,
        long Messages,
        [property: JsonPropertyName("messages_ready")] long MessagesReady,
        [property: JsonPropertyName("messages_unacknowledged")] long MessagesUnacknowledged,
        int Consumers,
        long Memory,
        [property: JsonPropertyName("idle_since")] string? IdleSince,
        [property: JsonPropertyName("message_stats")] MessageStatsDto? MessageStats,
        JsonElement Arguments);

    private sealed record MessageStatsDto(
        [property: JsonPropertyName("publish_details")] RateDto? PublishDetails,
        [property: JsonPropertyName("deliver_get_details")] RateDto? DeliverGetDetails,
        [property: JsonPropertyName("redeliver_details")] RateDto? RedeliverDetails);

    private sealed record RateDto(double Rate);

    private sealed record BindingDto(
        string? Source,
        [property: JsonPropertyName("routing_key")] string? RoutingKey,
        [property: JsonPropertyName("destination_type")] string? DestinationType,
        string? Destination);

    private sealed record GetMessageDto(
        [property: JsonPropertyName("payload_bytes")] int PayloadBytes,
        bool Redelivered,
        string? Exchange,
        [property: JsonPropertyName("routing_key")] string? RoutingKey,
        [property: JsonPropertyName("message_count")] long MessageCount,
        string? Payload,
        JsonElement Properties);
}
