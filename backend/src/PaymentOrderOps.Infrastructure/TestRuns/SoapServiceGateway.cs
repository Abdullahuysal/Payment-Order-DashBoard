using System.Net;
using System.Text;

namespace PaymentOrderOps.Infrastructure.TestRuns;

public interface ISoapServiceGateway
{
    Task<SoapResult> SendAsync(
        string reference, SoapServiceEndpointOptions target, SoapCall call, CancellationToken ct);
}

public sealed class SoapServiceGateway : ISoapServiceGateway, IDisposable
{
    private readonly HttpClient _http = new(new SocketsHttpHandler
    {
        PooledConnectionLifetime = TimeSpan.FromMinutes(2),
        AutomaticDecompression = DecompressionMethods.All,
    })
    {
        Timeout = Timeout.InfiniteTimeSpan,
    };

    public void Dispose() => _http.Dispose();

    public async Task<SoapResult> SendAsync(
        string reference, SoapServiceEndpointOptions target, SoapCall call, CancellationToken ct)
    {
        if (!Uri.TryCreate(target.Endpoint, UriKind.Absolute, out var uri))
        {
            throw new TestRunTargetUnreachableException("soap", reference, $"'{target.Endpoint}' is not an absolute URL");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, uri)
        {
            Content = new StringContent(call.Body, Encoding.UTF8, "text/xml"),
        };

        var soapAction = call.SoapAction ?? target.DefaultSoapAction;
        if (!string.IsNullOrWhiteSpace(soapAction))
        {
            request.Headers.TryAddWithoutValidation("SOAPAction", $"\"{soapAction.Trim('"')}\"");
        }

        if (call.Auth is not null)
        {
            request.Headers.TryAddWithoutValidation(call.Auth.Name, call.Auth.Value);
        }

        if (!string.IsNullOrWhiteSpace(call.CorrelationId))
        {
            request.Headers.TryAddWithoutValidation(CompanyApiGateway.CorrelationHeader, call.CorrelationId);
        }

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
                "soap", reference, $"the request timed out after {target.TimeoutSeconds}s");
        }
        catch (HttpRequestException ex)
        {
            throw new TestRunTargetUnreachableException("soap", reference, ex.Message, ex);
        }

        using (response)
        {
            var xml = await response.Content.ReadAsStringAsync(ct);
            return new SoapResult((int)response.StatusCode, xml);
        }
    }
}
