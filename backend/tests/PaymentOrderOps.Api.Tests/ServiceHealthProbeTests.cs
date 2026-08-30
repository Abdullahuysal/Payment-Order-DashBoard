using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;
using PaymentOrderOps.Domain.ServiceHealth;
using Xunit;

namespace PaymentOrderOps.Api.Tests;

public sealed class ServiceHealthProbeTests
{
    [Fact]
    public async Task Matching_status_reports_up()
    {
        var (probe, _) = Probe(_ => new HttpResponseMessage(HttpStatusCode.OK));

        var result = await probe.ExecuteAsync(Check(expectedStatus: 200), default);

        Assert.Equal(ServiceHealthProbeStatus.Up, result.Status);
        Assert.Equal(200, result.HttpStatus);
        Assert.Null(result.Error);
    }

    [Fact]
    public async Task Status_other_than_expected_reports_down()
    {
        var (probe, _) = Probe(_ => new HttpResponseMessage(HttpStatusCode.OK));

        var result = await probe.ExecuteAsync(Check(expectedStatus: 400), default);

        Assert.Equal(ServiceHealthProbeStatus.Down, result.Status);
        Assert.Equal(200, result.HttpStatus);
        Assert.Contains("Expected HTTP 400", result.Error);
    }

    [Fact]
    public async Task Transport_failure_reports_error_without_a_status()
    {
        var (probe, _) = Probe(_ => throw new HttpRequestException("No such host is known."));

        var result = await probe.ExecuteAsync(Check(expectedStatus: 200), default);

        Assert.Equal(ServiceHealthProbeStatus.Error, result.Status);
        Assert.Null(result.HttpStatus);
        Assert.Contains("No such host", result.Error);
    }

    [Fact]
    public async Task Method_headers_and_body_are_sent_as_stored()
    {
        HttpRequestMessage? sent = null;
        string? sentBody = null;
        var (probe, _) = Probe(request =>
        {
            sent = request;
            sentBody = request.Content?.ReadAsStringAsync().GetAwaiter().GetResult();
            return new HttpResponseMessage(HttpStatusCode.Created);
        });

        var check = Check(
            expectedStatus: 201,
            method: ServiceHealthHttpMethod.Post,
            headers: new Dictionary<string, string>
            {
                ["X-Environment"] = "preprod",
                ["Content-Type"] = "application/json; charset=utf-8",
            },
            body: """{"id":1}""");

        var result = await probe.ExecuteAsync(check, default);

        Assert.Equal(ServiceHealthProbeStatus.Up, result.Status);
        Assert.NotNull(sent);
        Assert.Equal(HttpMethod.Post, sent!.Method);
        Assert.Equal("preprod", sent.Headers.GetValues("X-Environment").Single());
        Assert.Equal("application/json", sent.Content?.Headers.ContentType?.MediaType);
        Assert.Equal("""{"id":1}""", sentBody);
    }

    [Fact]
    public async Task Blocked_host_is_rejected_before_any_request_is_sent()
    {
        var (probe, handler) = Probe(
            _ => new HttpResponseMessage(HttpStatusCode.OK),
            new ServiceHealthProbeOptions { BlockedHosts = ["internal.example.com"] });

        var result = await probe.ExecuteAsync(
            Check(expectedStatus: 200, url: "https://api.internal.example.com/health"),
            default);

        Assert.Equal(ServiceHealthProbeStatus.Error, result.Status);
        Assert.Equal(0, handler.CallCount);
    }

    private static (ServiceHealthProbe Probe, StubHandler Handler) Probe(
        Func<HttpRequestMessage, HttpResponseMessage> respond,
        ServiceHealthProbeOptions? options = null)
    {
        var handler = new StubHandler(respond);
        var probe = new ServiceHealthProbe(
            new HttpClient(handler),
            Microsoft.Extensions.Options.Options.Create(options ?? new ServiceHealthProbeOptions()),
            NullLogger<ServiceHealthProbe>.Instance);
        return (probe, handler);
    }

    private static ServiceHealthCheck Check(
        int expectedStatus,
        ServiceHealthHttpMethod method = ServiceHealthHttpMethod.Get,
        string url = "https://payments.example.com/health",
        IReadOnlyDictionary<string, string>? headers = null,
        string? body = null) => new(
        Guid.CreateVersion7(),
        ServiceEnvironment.Dev,
        "Payment Gateway",
        ServiceHealthGroup.Payment,
        method,
        url,
        headers,
        body,
        expectedStatus,
        isEnabled: true,
        ServiceHealthSource.Custom);

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        public int CallCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(respond(request));
        }
    }
}
