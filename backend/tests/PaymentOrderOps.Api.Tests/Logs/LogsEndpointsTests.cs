using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using PaymentOrderOps.Infrastructure.Logs;
using Xunit;

namespace PaymentOrderOps.Api.Tests.Logs;

public sealed class LogsEndpointsTests(LogsApiFactory factory) : IClassFixture<LogsApiFactory>
{
    private const string Root = "/api/v1/logs";

    private HttpClient Client(string environment = "dev")
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Environment", environment);
        return client;
    }

    private static LogEntry Entry(string id, string? level, string? service, DateTimeOffset? ts = null) => new(
        id, ts ?? DateTimeOffset.UtcNow, level, $"message {id}", service,
        "trace-1", null, "Test", "host-1",
        null, null, null,
        new Dictionary<string, string>());

    [Fact]
    public async Task Search_projects_paging_and_facets_from_the_gateway_result()
    {
        factory.LogSearch.NextSearchResult = new LogSearchResult(
            [Entry("a", "error", "payments-api"), Entry("b", "warn", "orders-api"), Entry("c", "error", "payments-api")],
            TotalCount: 7,
            LevelCounts: new Dictionary<string, long> { ["error"] = 5, ["warn"] = 2 },
            ServiceCounts: new Dictionary<string, long> { ["payments-api"] = 6, ["orders-api"] = 1 });

        var body = await Client().GetFromJsonAsync<JsonObject>($"{Root}/?pageSize=3&page=1");

        Assert.NotNull(body);
        var page = body!["page"]!;
        Assert.Equal(3, page["items"]!.AsArray().Count);
        Assert.Equal(7, (int)page["totalCount"]!);
        Assert.Equal(3, (int)page["totalPages"]!);
        Assert.Equal(1, (int)page["page"]!);

        var levels = body["facets"]!["levels"]!.AsArray();
        Assert.Equal("error", (string?)levels[0]!["key"]);
        Assert.Equal(5, (int)levels[0]!["count"]!);
        Assert.Equal(2, body["facets"]!["services"]!.AsArray().Count);
    }

    [Fact]
    public async Task Search_without_environment_header_returns_400()
    {
        var response = await factory.CreateClient().GetAsync($"{Root}/");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Search_when_elasticsearch_not_configured_returns_503()
    {
        var response = await Client("production").GetAsync($"{Root}/");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonObject>();
        Assert.False(string.IsNullOrWhiteSpace((string?)problem!["title"]));
    }

    [Fact]
    public async Task Search_with_invalid_page_size_returns_400()
    {
        var response = await Client().GetAsync($"{Root}/?pageSize=9999");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_log_returns_404_then_200()
    {
        factory.LogSearch.NextEntry = null;
        var missing = await Client().GetAsync($"{Root}/does-not-exist");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);

        factory.LogSearch.NextEntry = Entry("hit-1", "info", "orders-api");
        var found = await Client().GetFromJsonAsync<JsonObject>($"{Root}/hit-1");
        Assert.Equal("hit-1", (string?)found!["id"]);
        Assert.Equal("orders-api", (string?)found["service"]);
    }

    [Fact]
    public async Task List_exceptions_returns_the_grouped_result()
    {
        factory.LogSearch.NextExceptionGroups =
        [
            new ExceptionGroup("fp1", "System.InvalidOperationException", "boom *", "at X.Y()", 12,
                DateTimeOffset.UtcNow.AddHours(-3), DateTimeOffset.UtcNow, ["payments-api"]),
        ];

        var groups = await Client().GetFromJsonAsync<JsonArray>($"{Root}/exceptions");

        Assert.Single(groups!);
        Assert.Equal("fp1", (string?)groups![0]!["fingerprint"]);
        Assert.Equal(12, (int)groups[0]!["count"]!);
    }

    [Fact]
    public async Task Ai_summary_when_not_configured_returns_503_without_calling_the_model()
    {
        var before = factory.Summarizer.CallCount;

        var response = await Client("preprod").PostAsJsonAsync($"{Root}/ai-summary", new
        {
            from = DateTimeOffset.UtcNow.AddHours(-6),
            to = DateTimeOffset.UtcNow,
        });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal(before, factory.Summarizer.CallCount);
    }

    [Fact]
    public async Task Ai_summary_second_identical_request_is_served_from_cache_without_a_model_call()
    {
        factory.LogSearch.NextExceptionGroups =
        [
            new ExceptionGroup("fp-cache", "System.TimeoutException", "timed out after *", "at A.B()", 4,
                DateTimeOffset.UtcNow.AddHours(-2), DateTimeOffset.UtcNow, ["orders-api"]),
        ];

        var from = new DateTimeOffset(2026, 8, 30, 0, 0, 0, TimeSpan.Zero);
        var to = new DateTimeOffset(2026, 8, 30, 12, 0, 0, TimeSpan.Zero);
        var payload = new { from, to, filters = new { service = "orders-api" } };

        var callsBeforeFirst = factory.Summarizer.CallCount;
        var first = await Client().PostAsJsonAsync($"{Root}/ai-summary", payload);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var firstBody = await first.Content.ReadFromJsonAsync<JsonObject>();
        Assert.False((bool)firstBody!["cached"]!);
        Assert.Equal(callsBeforeFirst + 1, factory.Summarizer.CallCount);

        var callsBeforeSecond = factory.Summarizer.CallCount;
        var second = await Client().PostAsJsonAsync($"{Root}/ai-summary", payload);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        var secondBody = await second.Content.ReadFromJsonAsync<JsonObject>();
        Assert.True((bool)secondBody!["cached"]!);
        Assert.Equal(callsBeforeSecond, factory.Summarizer.CallCount);
    }

    [Fact]
    public async Task Ai_summary_with_inverted_window_returns_400()
    {
        var response = await Client().PostAsJsonAsync($"{Root}/ai-summary", new
        {
            from = DateTimeOffset.UtcNow,
            to = DateTimeOffset.UtcNow.AddHours(-1),
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Saved_queries_put_then_get_round_trips_and_dedupes_by_name()
    {
        var client = Client("preprod");
        var put = await client.PutAsJsonAsync($"{Root}/saved-queries", new
        {
            queries = new object[]
            {
                new { name = "payment errors", text = "level:error", service = "payments-api" },
                new { name = "PAYMENT ERRORS", text = "duplicate" },
                new { name = "slow", text = "duration:>5s" },
            },
        });

        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var putBody = await put.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal(2, putBody!["queries"]!.AsArray().Count);

        var get = await client.GetFromJsonAsync<JsonObject>($"{Root}/saved-queries");
        var names = get!["queries"]!.AsArray().Select(q => (string?)q!["name"]).ToList();
        Assert.Equal(["payment errors", "slow"], names);
        Assert.False(string.IsNullOrWhiteSpace((string?)get["updatedAt"]));
    }

    [Fact]
    public async Task Saved_queries_put_with_blank_name_returns_400()
    {
        var response = await Client().PutAsJsonAsync($"{Root}/saved-queries", new
        {
            queries = new object[] { new { name = "   ", text = "x" } },
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
