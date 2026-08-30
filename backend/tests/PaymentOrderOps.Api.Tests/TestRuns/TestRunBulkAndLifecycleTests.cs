using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.TestRuns;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class TestRunBulkAndLifecycleTests(TestRunsApiFactory factory) : IClassFixture<TestRunsApiFactory>
{
    private const string Root = "/api/v1/test-runs";

    private static HttpRequestStep Http(string key) => new()
    {
        Key = key,
        Title = key,
        Request = new HttpStepRequest { Method = "POST", Endpoint = "companyApi:orders", Path = "/x" },
    };

    [Fact]
    public async Task Bulk_run_creates_a_parent_with_child_iterations_and_a_summary()
    {
        factory.ResetFakes();
        var counter = 0;
        factory.CompanyApi.Respond = _ =>
        {
            var n = Interlocked.Increment(ref counter);
            var body = JsonNode.Parse($$"""{ "orderNo": "SO-{{n}}", "ok": true }""")!;
            return new CompanyApiResult(200, body, body.ToJsonString(), new Dictionary<string, string>());
        };

        var scenarioId = await factory.InsertScenarioAsync(
            $"bulk-{Guid.NewGuid():N}", TestScenarioKind.Generic, true,
            Http("call"),
            new ExtractStep
            {
                Key = "grab", Title = "grab", From = "call",
                Map = new Dictionary<string, string> { ["orderNo"] = "$.orderNo" },
            });

        var client = factory.Client();
        var response = await client.PostAsJsonAsync(
            Root, new { scenarioId, runParams = new { }, repeat = new { count = 3, concurrency = 2 } });
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var runId = Guid.Parse((string)(await response.Content.ReadFromJsonAsync<JsonObject>())!["runId"]!);

        var run = await factory.PollUntilTerminalAsync(client, runId, 30000);

        Assert.Equal("passed", (string?)run["status"]);
        var iterations = run["iterations"]!.AsArray();
        Assert.Equal(3, iterations.Count);
        Assert.All(iterations, i => Assert.Equal("passed", (string?)i!["status"]));
        Assert.Equal(3, (int?)run["summary"]!["total"]);
        Assert.Equal(3, (int?)run["summary"]!["passed"]);
        Assert.Equal(3, run["summary"]!["orderNos"]!.AsArray().Count);
        Assert.Equal(3, (int?)run["repeat"]!["count"]);
    }

    [Fact]
    public async Task Repeat_count_above_the_limit_is_rejected_with_400()
    {
        factory.ResetFakes();
        var scenarioId = await factory.InsertScenarioAsync(
            $"bulklimit-{Guid.NewGuid():N}", TestScenarioKind.Generic, true, Http("call"));

        var response = await factory.Client().PostAsJsonAsync(
            Root, new { scenarioId, runParams = new { }, repeat = new { count = 11, concurrency = 2 } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Cancel_on_a_running_run_transitions_it_to_cancelled()
    {
        factory.ResetFakes();
        var scenarioId = await factory.InsertScenarioAsync(
            $"cancel-{Guid.NewGuid():N}", TestScenarioKind.Generic, false,
            Http("call"),
            new DelayStep { Key = "long", Title = "long", Ms = 8000 });

        var client = factory.Client();
        var start = await client.PostAsJsonAsync(Root, new { scenarioId, runParams = new { } });
        var runId = Guid.Parse((string)(await start.Content.ReadFromJsonAsync<JsonObject>())!["runId"]!);

        await Task.Delay(600);
        var cancel = await client.PostAsync($"{Root}/{runId}/cancel", null);
        Assert.Equal(HttpStatusCode.Accepted, cancel.StatusCode);

        var run = await factory.PollUntilTerminalAsync(client, runId, 15000);
        Assert.Equal("cancelled", (string?)run["status"]);

        var again = await client.PostAsync($"{Root}/{runId}/cancel", null);
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
    }

    [Fact]
    public async Task Cancel_on_an_unknown_run_returns_404()
    {
        var response = await factory.Client().PostAsync($"{Root}/{Guid.NewGuid()}/cancel", null);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task List_runs_excludes_bulk_children_and_filters_by_status()
    {
        factory.ResetFakes();
        var scenarioId = await factory.InsertScenarioAsync(
            $"list-{Guid.NewGuid():N}", TestScenarioKind.Generic, true, Http("call"));

        var client = factory.Client();
        var bulk = await client.PostAsJsonAsync(
            Root, new { scenarioId, runParams = new { }, repeat = new { count = 2, concurrency = 2 } });
        var runId = Guid.Parse((string)(await bulk.Content.ReadFromJsonAsync<JsonObject>())!["runId"]!);
        await factory.PollUntilTerminalAsync(client, runId, 30000);

        var all = await client.GetFromJsonAsync<JsonArray>($"{Root}?scenarioId={scenarioId}");
        Assert.Single(all!);
        Assert.Equal(runId.ToString(), (string?)all![0]!["id"]);

        var passed = await client.GetFromJsonAsync<JsonArray>($"{Root}?scenarioId={scenarioId}&status=passed");
        Assert.Single(passed!);

        var failed = await client.GetFromJsonAsync<JsonArray>($"{Root}?scenarioId={scenarioId}&status=failed");
        Assert.Empty(failed!);
    }
}
