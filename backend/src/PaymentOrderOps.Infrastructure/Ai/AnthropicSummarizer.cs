using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using PaymentOrderOps.Infrastructure.Logs;

namespace PaymentOrderOps.Infrastructure.Ai;

/// <summary>
/// <see cref="IAiSummarizer"/> backed by the Anthropic Messages API
/// (<c>POST {BaseUrl}/v1/messages</c>, <c>x-api-key</c> + <c>anthropic-version</c> headers).
/// </summary>
public sealed class AnthropicSummarizer : IAiSummarizer, IDisposable
{
    private const string MessagesPath = "v1/messages";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;

    public AnthropicSummarizer()
        : this(new SocketsHttpHandler { PooledConnectionLifetime = TimeSpan.FromMinutes(2) })
    {
    }

    internal AnthropicSummarizer(HttpMessageHandler handler) =>
        _http = new HttpClient(handler) { Timeout = Timeout.InfiniteTimeSpan };

    public void Dispose() => _http.Dispose();

    public async Task<AiLogSummary> SummarizeAsync(
        AnthropicConnection connection,
        IReadOnlyList<ExceptionGroup> groups,
        DateTimeOffset windowStart,
        DateTimeOffset windowEnd,
        CancellationToken ct)
    {
        var options = connection.Options;
        if (!options.IsConfigured)
        {
            throw new AiNotConfiguredException(connection.Environment);
        }

        var body = new
        {
            model = options.Model,
            max_tokens = options.MaxTokens,
            system = SystemPrompt,
            messages = new[]
            {
                new { role = "user", content = BuildUserPrompt(groups, windowStart, windowEnd) },
            },
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{options.BaseUrl.TrimEnd('/')}/{MessagesPath}")
        {
            Content = JsonContent.Create(body, options: Json),
        };
        request.Headers.TryAddWithoutValidation("x-api-key", options.ApiKey.Trim());
        request.Headers.TryAddWithoutValidation("anthropic-version", options.AnthropicVersion);

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, options.TimeoutSeconds)));

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, HttpCompletionOption.ResponseContentRead, timeout.Token);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new AiUnreachableException($"the request timed out after {options.TimeoutSeconds}s");
        }
        catch (HttpRequestException ex)
        {
            throw new AiUnreachableException($"HTTP transport error: {ex.Message}", ex);
        }

        using (response)
        {
            var raw = await response.Content.ReadAsStringAsync(ct);
            if (!response.IsSuccessStatusCode)
            {
                var detail = raw.Length > 300 ? raw[..300] : raw;
                throw new AiUnreachableException(
                    response.StatusCode == HttpStatusCode.Unauthorized
                        ? "authentication failed (check the API key)"
                        : $"the Messages API answered {(int)response.StatusCode}: {detail}");
            }

            return Parse(ExtractText(raw), groups.Count);
        }
    }

    private static string ExtractText(string raw)
    {
        try
        {
            using var document = JsonDocument.Parse(raw);
            if (document.RootElement.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.Array)
            {
                var builder = new StringBuilder();
                foreach (var block in content.EnumerateArray())
                {
                    if (block.TryGetProperty("type", out var type) && type.GetString() == "text"
                        && block.TryGetProperty("text", out var text))
                    {
                        builder.Append(text.GetString());
                    }
                }

                return builder.ToString();
            }
        }
        catch (JsonException ex)
        {
            throw new AiUnreachableException($"the Messages API returned a malformed envelope: {ex.Message}", ex);
        }

        throw new AiUnreachableException("the Messages API response had no text content");
    }

    private static AiLogSummary Parse(string text, int groupCount)
    {
        var json = Unwrap(text);

        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;

            var headline = root.TryGetProperty("headline", out var headlineElement)
                ? headlineElement.GetString() ?? string.Empty
                : string.Empty;

            var groups = new List<AiLogSummaryGroup>();
            if (root.TryGetProperty("groups", out var groupArray) && groupArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var group in groupArray.EnumerateArray())
                {
                    var index = group.TryGetProperty("index", out var indexElement) && indexElement.TryGetInt32(out var parsed)
                        ? parsed
                        : groups.Count;

                    groups.Add(new AiLogSummaryGroup(
                        Math.Clamp(index, 0, Math.Max(0, groupCount - 1)),
                        Str(group, "rootCauseGuess"),
                        Str(group, "impact"),
                        Str(group, "suggestedAction"),
                        Str(group, "confidence")));
                }
            }

            return new AiLogSummary(headline, groups);
        }
        catch (JsonException ex)
        {
            throw new AiUnreachableException($"the model did not return the agreed JSON contract: {ex.Message}", ex);
        }
    }

    private static string Str(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) ? value.GetString() ?? string.Empty : string.Empty;

    private static string Unwrap(string text)
    {
        var trimmed = text.Trim();
        if (trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            var firstBreak = trimmed.IndexOf('\n');
            if (firstBreak >= 0)
            {
                trimmed = trimmed[(firstBreak + 1)..];
            }

            var fence = trimmed.LastIndexOf("```", StringComparison.Ordinal);
            if (fence >= 0)
            {
                trimmed = trimmed[..fence];
            }
        }

        return trimmed.Trim();
    }

    private static string BuildUserPrompt(
        IReadOnlyList<ExceptionGroup> groups, DateTimeOffset windowStart, DateTimeOffset windowEnd)
    {
        var builder = new StringBuilder();
        builder.Append("Time window (UTC): ").Append(windowStart.UtcDateTime.ToString("O"))
            .Append(" .. ").Append(windowEnd.UtcDateTime.ToString("O")).Append('\n');
        builder.Append("Exception groups (index, type, count, sample message, top frame, services):\n");

        for (var i = 0; i < groups.Count; i++)
        {
            var group = groups[i];
            builder.Append(i).Append(". ").Append(group.ExceptionType)
                .Append(" | count=").Append(group.Count)
                .Append(" | services=").Append(group.Services.Count == 0 ? "?" : string.Join(",", group.Services))
                .Append('\n')
                .Append("   message: ").Append(Truncate(group.SampleMessage, 300)).Append('\n')
                .Append("   topFrame: ").Append(Truncate(group.TopFrame ?? "(none)", 200)).Append('\n');
        }

        builder.Append("\nReturn ONLY minified JSON matching: ")
            .Append("{\"headline\":string,\"groups\":[{\"index\":number,\"rootCauseGuess\":string,")
            .Append("\"impact\":string,\"suggestedAction\":string,\"confidence\":\"low\"|\"medium\"|\"high\"}]}");
        return builder.ToString();
    }

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max] + "…";

    private const string SystemPrompt =
        "You are a senior SRE triaging application exception clusters. Be terse and concrete. " +
        "Never invent stack frames or identifiers that are not in the input. " +
        "Respond with a single JSON object and nothing else.";
}
