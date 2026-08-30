using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Infrastructure.Messaging;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;
using Xunit;

namespace PaymentOrderOps.Api.Tests;

public sealed class MessageQueuesEndpointsTests(ServiceHealthApiFactory factory)
    : IClassFixture<ServiceHealthApiFactory>
{
    private const string BaseRoute = "/api/v1/message-queues";

    private HttpClient Client(string environment = "dev")
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Environment", environment);
        return client;
    }

    [Fact]
    public async Task Request_without_environment_header_returns_400()
    {
        var response = await factory.CreateClient().GetAsync($"{BaseRoute}/brokers");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Brokers_lists_both_brokers_as_unconfigured_when_no_connection_is_set()
    {
        var brokers = await Client().GetFromJsonAsync<JsonArray>($"{BaseRoute}/brokers");

        Assert.NotNull(brokers);
        Assert.Equal(2, brokers!.Count);
        Assert.Contains(brokers, b => (string?)b!["broker"] == "rabbitmq");
        Assert.Contains(brokers, b => (string?)b!["broker"] == "kafka");
        Assert.All(brokers, b =>
        {
            Assert.False((bool?)b!["configured"]);
            Assert.False((bool?)b["reachable"]);
        });
    }

    [Theory]
    [InlineData("rabbitmq/queues")]
    [InlineData("kafka/topics")]
    [InlineData("kafka/consumer-groups")]
    public async Task Broker_endpoints_return_503_when_not_configured(string path)
    {
        var response = await Client().GetAsync($"{BaseRoute}/{path}");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal(503, (int?)problem!["status"]);
    }

    [Fact]
    public async Task Broker_health_rejects_an_unknown_broker_with_400()
    {
        var response = await Client().GetAsync($"{BaseRoute}/brokers/postgres/health");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Rabbitmq_queues_rejects_an_unknown_category_with_400()
    {
        var response = await Client().GetAsync($"{BaseRoute}/rabbitmq/queues?category=bogus");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonObject>();
        Assert.NotNull(problem!["errors"]!["category"]);
    }

    [Fact]
    public async Task Dead_letters_returns_a_partial_result_with_warnings_when_nothing_is_configured()
    {
        var overview = await Client().GetFromJsonAsync<JsonObject>($"{BaseRoute}/dead-letters");

        Assert.NotNull(overview);
        Assert.Empty(overview!["items"]!.AsArray());
        Assert.Equal(0, (long?)overview["totalDeadLettered"]);
        Assert.Equal(0, (long?)overview["scopedTotalDeadLettered"]);
        var warnings = overview["warnings"]!.AsArray();
        Assert.Equal(2, warnings.Count);
        Assert.Contains(warnings, w => ((string?)w)!.Contains("RabbitMQ", StringComparison.Ordinal));
        Assert.Contains(warnings, w => ((string?)w)!.Contains("Kafka", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Alerts_is_empty_when_no_broker_is_configured()
    {
        var alerts = await Client().GetFromJsonAsync<JsonArray>($"{BaseRoute}/alerts");
        Assert.NotNull(alerts);
        Assert.Empty(alerts!);
    }

    [Fact]
    public async Task Scope_get_put_roundtrip_normalises_and_isolates_by_environment()
    {
        var client = Client("production");

        var empty = await client.GetFromJsonAsync<JsonObject>($"{BaseRoute}/scope");
        Assert.Empty(empty!["patterns"]!.AsArray());
        Assert.Null((string?)empty["updatedAt"]);

        var put = await client.PutAsJsonAsync($"{BaseRoute}/scope", new { patterns = new[] { "payment.*", "  wallet.*  ", "payment.*" } });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var stored = await put.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal(new[] { "payment.*", "wallet.*" }, stored!["patterns"]!.AsArray().Select(p => (string?)p));
        Assert.NotNull((string?)stored["updatedAt"]);

        var reread = await client.GetFromJsonAsync<JsonObject>($"{BaseRoute}/scope");
        Assert.Equal(new[] { "payment.*", "wallet.*" }, reread!["patterns"]!.AsArray().Select(p => (string?)p));

        var otherEnv = await Client("preprod").GetFromJsonAsync<JsonObject>($"{BaseRoute}/scope");
        Assert.Empty(otherEnv!["patterns"]!.AsArray());

        var clear = await client.PutAsJsonAsync($"{BaseRoute}/scope", new { patterns = Array.Empty<string>() });
        Assert.Equal(HttpStatusCode.OK, clear.StatusCode);
    }

    [Fact]
    public async Task Scope_put_rejects_invalid_payloads()
    {
        var client = Client("production");

        var nullBody = await client.PutAsJsonAsync($"{BaseRoute}/scope", new { });
        Assert.Equal(HttpStatusCode.BadRequest, nullBody.StatusCode);

        var blankItem = await client.PutAsJsonAsync($"{BaseRoute}/scope", new { patterns = new[] { "payment.*", "  " } });
        Assert.Equal(HttpStatusCode.BadRequest, blankItem.StatusCode);

        var tooMany = await client.PutAsJsonAsync($"{BaseRoute}/scope",
            new { patterns = Enumerable.Range(0, 101).Select(i => $"q{i}.*").ToArray() });
        Assert.Equal(HttpStatusCode.BadRequest, tooMany.StatusCode);

        var tooLong = await client.PutAsJsonAsync($"{BaseRoute}/scope",
            new { patterns = new[] { new string('x', 257) } });
        Assert.Equal(HttpStatusCode.BadRequest, tooLong.StatusCode);
    }

    [Theory]
    [InlineData("orders.dlq", new[] { "*.dlq" }, true)]
    [InlineData("orders.DLQ", new[] { "*.dlq" }, true)]
    [InlineData("orders.main", new[] { "*.dlq", "*.dead-letter" }, false)]
    [InlineData("payments.DLT", new[] { "*.DLT" }, true)]
    [InlineData("a-b-c", new[] { "a?b?c" }, true)]
    public void GlobPattern_matches_dead_letter_names(string value, string[] patterns, bool expected) =>
        Assert.Equal(expected, GlobPattern.MatchesAny(value, patterns));

    [Theory]
    [InlineData("payments-inbound", "payment", true)]
    [InlineData("orders-inbound", "payment", false)]
    [InlineData("payment.retry", "payment.*", true)]
    [InlineData("PAYMENT.retry", "payment.*", true)]
    [InlineData("wallet.error", "*.error", true)]
    [InlineData("wallet.errors", "*.error", false)]
    [InlineData("anything", "", false)]
    public void MatchesLoose_treats_wildcard_and_plain_patterns_differently(string value, string pattern, bool expected) =>
        Assert.Equal(expected, GlobPattern.MatchesLoose(value, pattern));

    [Fact]
    public void MatchesAnyLoose_is_or_across_patterns() =>
        Assert.True(GlobPattern.MatchesAnyLoose("wallet.error", ["payment.*", "*.error"]));

    [Theory]
    [InlineData("orders.dlq", true, 0, 0, 100, new[] { "error" })]
    [InlineData("orders.skip", false, 0, 0, 100, new[] { "skip" })]
    [InlineData("orders.main", false, 5, 0, 100, new[] { "backlog" })]
    [InlineData("orders.main", false, 150, 3, 100, new[] { "backlog" })]
    [InlineData("orders.main", false, 5, 3, 100, new string[0])]
    public void QueueCategories_classifies_by_name_flags_and_depth(
        string name, bool isDeadLetter, long ready, int consumers, long threshold, string[] expected)
    {
        var queue = new RabbitMqQueue(name, "/", "running", ready, ready, 0, consumers, 0, 0, 0, null, isDeadLetter, false);
        Assert.Equal(expected, QueueCategories.For(queue, threshold));
    }

    [Fact]
    public void Name_filter_is_applied_before_paging()
    {
        var queues = new[] { "a.dlq", "b.main", "c.dlq", "d.main", "e.dlq" };
        IReadOnlyList<string> matched = [.. queues.Where(q => GlobPattern.MatchesAnyLoose(q, ["*.dlq"]))];

        var page = matched.ToPage(page: 1, pageSize: 2);

        Assert.Equal(3, page.TotalCount);
        Assert.Equal(2, page.PageSize);
        Assert.Equal(2, page.TotalPages);
        Assert.Equal(new[] { "a.dlq", "c.dlq" }, page.Items);
    }
}
