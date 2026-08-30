using System.Diagnostics;
using System.Text;
using Microsoft.Extensions.Options;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;

/// <summary>
/// Executes a stored check as a real outbound HTTP request and compares the response status
/// against <see cref="ServiceHealthCheck.ExpectedStatusCode"/>. Transport failures are reported
/// as <see cref="ServiceHealthProbeStatus.Error"/>; a reachable target with the wrong status is
/// <see cref="ServiceHealthProbeStatus.Down"/>.
/// </summary>
public sealed class ServiceHealthProbe(
    HttpClient http,
    IOptions<ServiceHealthProbeOptions> options,
    ILogger<ServiceHealthProbe> logger)
{
    private const string ContentTypeHeader = "Content-Type";
    private const string DefaultContentType = "application/json";

    private readonly ServiceHealthProbeOptions _options = options.Value;

    public async Task<ServiceHealthProbeResponse> ExecuteAsync(ServiceHealthCheck check, CancellationToken ct)
    {
        var checkedAt = DateTime.UtcNow;

        if (!Uri.TryCreate(check.Url, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            return Failed(check, checkedAt, 0, "URL is not an absolute http/https address.");
        }

        if (RejectHost(uri.Host) is { } rejection)
        {
            return Failed(check, checkedAt, 0, rejection);
        }

        var timeout = TimeSpan.FromSeconds(Math.Clamp(_options.TimeoutSeconds, 1, 120));
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(ct);
        deadline.CancelAfter(timeout);

        var stopwatch = Stopwatch.StartNew();
        try
        {
            using var request = BuildRequest(check, uri);
            using var response = await http.SendAsync(
                request, HttpCompletionOption.ResponseHeadersRead, deadline.Token);
            stopwatch.Stop();

            var httpStatus = (int)response.StatusCode;
            var matched = httpStatus == check.ExpectedStatusCode;

            return new ServiceHealthProbeResponse(
                check.Id,
                check.Name,
                matched ? ServiceHealthProbeStatus.Up : ServiceHealthProbeStatus.Down,
                check.Method.ToWireValue(),
                check.Url,
                check.ExpectedStatusCode,
                httpStatus,
                stopwatch.ElapsedMilliseconds,
                matched
                    ? null
                    : $"Expected HTTP {check.ExpectedStatusCode} but the service answered {httpStatus} {response.ReasonPhrase}.".TrimEnd(),
                checkedAt);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            stopwatch.Stop();
            return Failed(check, checkedAt, stopwatch.ElapsedMilliseconds,
                $"Request timed out after {timeout.TotalSeconds:0.#}s.");
        }
        catch (HttpRequestException ex)
        {
            stopwatch.Stop();
            logger.LogDebug(ex, "Service-health probe failed for {CheckId} ({Url}).", check.Id, check.Url);
            return Failed(check, checkedAt, stopwatch.ElapsedMilliseconds, Describe(ex));
        }
    }

    public static ServiceHealthProbeResponse Skipped(ServiceHealthCheck check, DateTime checkedAt) => new(
        check.Id,
        check.Name,
        ServiceHealthProbeStatus.Skipped,
        check.Method.ToWireValue(),
        check.Url,
        check.ExpectedStatusCode,
        HttpStatus: null,
        DurationMs: 0,
        Error: "Check is disabled.",
        checkedAt);

    private static HttpRequestMessage BuildRequest(ServiceHealthCheck check, Uri uri)
    {
        var request = new HttpRequestMessage(new HttpMethod(check.Method.ToWireValue()), uri);

        var contentType = FindHeader(check.Headers, ContentTypeHeader);
        if (AllowsBody(check.Method) && !string.IsNullOrEmpty(check.Body))
        {
            request.Content = new StringContent(
                check.Body, Encoding.UTF8, MediaTypeOf(contentType) ?? DefaultContentType);
        }

        foreach (var (key, value) in check.Headers)
        {
            if (string.Equals(key, ContentTypeHeader, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!request.Headers.TryAddWithoutValidation(key, value))
            {
                request.Content?.Headers.TryAddWithoutValidation(key, value);
            }
        }

        return request;
    }

    private static bool AllowsBody(ServiceHealthHttpMethod method) => method
        is ServiceHealthHttpMethod.Post
        or ServiceHealthHttpMethod.Put
        or ServiceHealthHttpMethod.Patch
        or ServiceHealthHttpMethod.Delete;

    private static string? FindHeader(IReadOnlyDictionary<string, string> headers, string name)
    {
        foreach (var (key, value) in headers)
        {
            if (string.Equals(key, name, StringComparison.OrdinalIgnoreCase))
            {
                return value;
            }
        }

        return null;
    }

    /// <summary>Strips any <c>; charset=…</c> parameter — <see cref="StringContent"/> adds its own.</summary>
    private static string? MediaTypeOf(string? contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            return null;
        }

        var media = contentType.Split(';', 2)[0].Trim();
        return media.Length == 0 ? null : media;
    }

    private string? RejectHost(string host)
    {
        if (_options.AllowedHosts.Length > 0 && !_options.AllowedHosts.Any(entry => HostMatches(host, entry)))
        {
            return $"Host '{host}' is not in the configured {ServiceHealthProbeOptions.SectionName}:AllowedHosts list.";
        }

        return _options.BlockedHosts.Any(entry => HostMatches(host, entry))
            ? $"Host '{host}' is blocked by {ServiceHealthProbeOptions.SectionName}:BlockedHosts."
            : null;
    }

    private static bool HostMatches(string host, string entry)
    {
        entry = entry.Trim().TrimStart('.');
        return entry.Length > 0
               && (host.Equals(entry, StringComparison.OrdinalIgnoreCase)
                   || host.EndsWith($".{entry}", StringComparison.OrdinalIgnoreCase));
    }

    private static string Describe(HttpRequestException ex) =>
        ex.InnerException is { } inner ? $"{ex.Message} ({inner.Message})" : ex.Message;

    private static ServiceHealthProbeResponse Failed(
        ServiceHealthCheck check, DateTime checkedAt, long durationMs, string error) => new(
        check.Id,
        check.Name,
        ServiceHealthProbeStatus.Error,
        check.Method.ToWireValue(),
        check.Url,
        check.ExpectedStatusCode,
        HttpStatus: null,
        durationMs,
        error,
        checkedAt);
}
