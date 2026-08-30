using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace PaymentOrderOps.Infrastructure.TestRuns;

public interface ICompanyApiGateway
{
    Task<CompanyApiResult> SendAsync(
        string reference, CompanyApiEndpointOptions target, CompanyApiCall call, CancellationToken ct);
}

public sealed class CompanyApiGateway : ICompanyApiGateway, IDisposable
{
    public const string CorrelationHeader = "X-Correlation-ID";

    private readonly HttpClient _http = new(new SocketsHttpHandler
    {
        PooledConnectionLifetime = TimeSpan.FromMinutes(2),
        AutomaticDecompression = DecompressionMethods.All,
    })
    {
        Timeout = Timeout.InfiniteTimeSpan,
    };

    public void Dispose() => _http.Dispose();

    public async Task<CompanyApiResult> SendAsync(
        string reference, CompanyApiEndpointOptions target, CompanyApiCall call, CancellationToken ct)
    {
        using var request = BuildRequest(reference, target, call);

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, target.TimeoutSeconds)));

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, HttpCompletionOption.ResponseContentRead, timeout.Token);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new TestRunTargetUnreachableException(
                "companyApi", reference, $"the request timed out after {target.TimeoutSeconds}s");
        }
        catch (HttpRequestException ex)
        {
            throw new TestRunTargetUnreachableException("companyApi", reference, ex.Message, ex);
        }

        using (response)
        {
            var raw = await response.Content.ReadAsStringAsync(ct);
            var headers = response.Headers
                .Concat(response.Content.Headers)
                .ToDictionary(h => h.Key, h => string.Join(", ", h.Value), StringComparer.OrdinalIgnoreCase);

            return new CompanyApiResult((int)response.StatusCode, TryParseJson(raw), raw, headers);
        }
    }

    private static HttpRequestMessage BuildRequest(
        string reference, CompanyApiEndpointOptions target, CompanyApiCall call)
    {
        var uri = BuildUri(reference, target.BaseUrl, call.Path, call.Query);
        var request = new HttpRequestMessage(new HttpMethod(call.Method.ToUpperInvariant()), uri);

        if (call.Body is not null)
        {
            request.Content = new StringContent(call.Body.ToJsonString(), Encoding.UTF8, "application/json");
        }

        if (call.Headers is not null)
        {
            foreach (var (key, value) in call.Headers)
            {
                if (!request.Headers.TryAddWithoutValidation(key, value))
                {
                    request.Content?.Headers.TryAddWithoutValidation(key, value);
                }
            }
        }

        if (call.Auth is not null)
        {
            request.Headers.TryAddWithoutValidation(call.Auth.Name, call.Auth.Value);
        }

        if (!string.IsNullOrWhiteSpace(call.CorrelationId))
        {
            request.Headers.TryAddWithoutValidation(CorrelationHeader, call.CorrelationId);
        }

        return request;
    }

    private static Uri BuildUri(
        string reference, string baseUrl, string? path, IReadOnlyDictionary<string, string>? query)
    {
        if (!Uri.TryCreate(baseUrl.TrimEnd('/') + "/" + (path ?? string.Empty).TrimStart('/'), UriKind.Absolute, out var uri))
        {
            throw new TestRunTargetUnreachableException("companyApi", reference, $"'{baseUrl}' is not an absolute URL");
        }

        if (query is not { Count: > 0 })
        {
            return uri;
        }

        var builder = new UriBuilder(uri);
        var pairs = query.Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}");
        builder.Query = string.IsNullOrEmpty(builder.Query)
            ? string.Join('&', pairs)
            : builder.Query.TrimStart('?') + "&" + string.Join('&', pairs);
        return builder.Uri;
    }

    private static JsonNode? TryParseJson(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        try
        {
            return JsonNode.Parse(raw);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
