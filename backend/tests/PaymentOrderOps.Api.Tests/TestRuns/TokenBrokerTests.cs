using System.Net;
using System.Text;
using PaymentOrderOps.Infrastructure.TestRuns;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class TokenBrokerTests
{
    private static TestRunTargetsOptions Options(string kind, string? value = null, int ttlSeconds = 60)
    {
        var provider = new AuthProviderOptions
        {
            Kind = kind,
            Header = "X-Auth-Token",
            Value = value,
            Url = "https://auth.internal/token",
            Method = "POST",
            BodyTemplate = "{\"client\":\"x\"}",
            TokenPath = "$.access_token",
            ValuePath = "$.value",
            Format = "Bearer {token}",
            TtlSeconds = ttlSeconds,
        };

        return new TestRunTargetsOptions
        {
            Environments =
            {
                ["Dev"] = new EnvironmentTargets { Auth = { ["companyAuth"] = provider } },
            },
        };
    }

    [Fact]
    public async Task None_kind_returns_no_header()
    {
        var broker = new TokenBroker(Options("none"), TimeProvider.System, new StubHandler(_ => Json("{}")));
        Assert.Null(await broker.ResolveAsync("Dev", "companyAuth", null, default));
    }

    [Fact]
    public async Task Static_kind_returns_configured_header_and_value()
    {
        var options = Options("static", value: "s3cr3t-value");
        var broker = new TokenBroker(options, TimeProvider.System, new StubHandler(_ => Json("{}")));

        var header = await broker.ResolveAsync("Dev", "companyAuth", null, default);

        Assert.Equal("X-Auth-Token", header!.Name);
        Assert.Equal("s3cr3t-value", header.Value);
    }

    [Fact]
    public async Task TokenEndpoint_caches_within_ttl_then_refreshes()
    {
        var clock = new ManualTimeProvider(DateTimeOffset.UtcNow);
        var calls = 0;
        var handler = new StubHandler(_ =>
        {
            calls++;
            return Json($$"""{"access_token":"tok-{{calls}}"}""");
        });
        var broker = new TokenBroker(Options("tokenEndpoint", ttlSeconds: 60), clock, handler);

        var first = await broker.ResolveAsync("Dev", "companyAuth", null, default);
        var cached = await broker.ResolveAsync("Dev", "companyAuth", null, default);
        Assert.Equal("Bearer tok-1", first!.Value);
        Assert.Equal("Bearer tok-1", cached!.Value);
        Assert.Equal(1, calls);

        clock.Advance(TimeSpan.FromSeconds(61));
        var refreshed = await broker.ResolveAsync("Dev", "companyAuth", null, default);
        Assert.Equal("Bearer tok-2", refreshed!.Value);
        Assert.Equal(2, calls);
    }

    [Fact]
    public async Task ServiceHeader_kind_calls_on_every_resolve()
    {
        var calls = 0;
        var handler = new StubHandler(_ =>
        {
            calls++;
            return Json($$"""{"value":"v-{{calls}}"}""");
        });
        var broker = new TokenBroker(Options("serviceHeader"), TimeProvider.System, handler);

        var a = await broker.ResolveAsync("Dev", "companyAuth", null, default);
        var b = await broker.ResolveAsync("Dev", "companyAuth", null, default);

        Assert.Equal("v-1", a!.Value);
        Assert.Equal("v-2", b!.Value);
        Assert.Equal(2, calls);
    }

    private static HttpResponseMessage Json(string body) =>
        new(HttpStatusCode.OK) { Content = new StringContent(body, Encoding.UTF8, "application/json") };

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(respond(request));
    }

    private sealed class ManualTimeProvider(DateTimeOffset now) : TimeProvider
    {
        private DateTimeOffset _now = now;

        public void Advance(TimeSpan by) => _now = _now.Add(by);

        public override DateTimeOffset GetUtcNow() => _now;
    }
}
