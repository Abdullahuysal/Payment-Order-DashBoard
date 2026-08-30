using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using PaymentOrderOps.Infrastructure.TestRuns;
using PaymentOrderOps.Domain.TestRuns;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class TestRunExecutionTests(TestRunsApiFactory factory) : IClassFixture<TestRunsApiFactory>
{
    private const string Root = "/api/v1/test-runs";

    private static HttpRequestStep Http(string key, string path = "/x") => new()
    {
        Key = key,
        Title = key,
        Request = new HttpStepRequest
        {
            Method = "POST",
            Endpoint = "companyApi:orders",
            Path = path,
            Headers = new Dictionary<string, string> { ["Authorization"] = "Bearer plaintext-token" },
        },
    };

    private static async Task<Guid> StartAsync(HttpClient client, Guid scenarioId, object? repeat = null)
    {
        var response = await client.PostAsJsonAsync(Root, new { scenarioId, runParams = new { }, repeat });
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonObject>();
        return Guid.Parse((string)body!["runId"]!);
    }

    [Fact]
    public async Task Happy_path_runs_steps_in_order_and_captures_extracted_variables()
    {
        factory.ResetFakes();
        var scenarioId = await factory.InsertScenarioAsync(
            $"happy-{Guid.NewGuid():N}", TestScenarioKind.Generic, false,
            Http("call"),
            new ExtractStep
            {
                Key = "grab", Title = "grab", From = "call",
                Map = new Dictionary<string, string> { ["orderNo"] = "$.orderNo" },
            },
            new AssertStep
            {
                Key = "check", Title = "check",
                Expect = new Assertion { JsonPath = "$.orderNo", Op = AssertionOp.Equals, Value = JsonValue.Create("SO-TEST") },
            });

        var client = factory.Client();
        var runId = await StartAsync(client, scenarioId);
        var run = await factory.PollUntilTerminalAsync(client, runId);

        Assert.Equal("passed", (string?)run["status"]);
        var steps = run["steps"]!.AsArray();
        Assert.Equal(new[] { "call", "grab", "check" }, steps.Select(s => (string?)s!["key"]));
        Assert.All(steps, s => Assert.Equal("passed", (string?)s!["status"]));
        Assert.Equal("SO-TEST", (string?)run["variables"]!["orderNo"]);
    }

    [Fact]
    public async Task Poll_retries_until_ready_and_counts_attempts()
    {
        factory.ResetFakes();
        var calls = 0;
        factory.CompanyApi.Respond = _ =>
        {
            calls++;
            var ready = calls >= 3;
            var body = JsonNode.Parse($$"""{ "ready": {{(ready ? "true" : "false")}} }""")!;
            return new CompanyApiResult(200, body, body.ToJsonString(), new Dictionary<string, string>());
        };

        var scenarioId = await factory.InsertScenarioAsync(
            $"poll-{Guid.NewGuid():N}", TestScenarioKind.Generic, false,
            new PollStep
            {
                Key = "wait", Title = "wait",
                IntervalMs = 40, TimeoutMs = 5000,
                Read = new PollRead { Http = new HttpStepRequest { Method = "GET", Endpoint = "companyApi:orders", Path = "/s" } },
                Until = new Assertion { JsonPath = "$.ready", Op = AssertionOp.Equals, Value = JsonValue.Create(true) },
            });

        var client = factory.Client();
        var run = await factory.PollUntilTerminalAsync(client, await StartAsync(client, scenarioId));

        Assert.Equal("passed", (string?)run["status"]);
        Assert.Equal(3, (int?)run["steps"]!.AsArray()[0]!["attempts"]);
    }

    [Fact]
    public async Task Poll_times_out_and_fails_the_run()
    {
        factory.ResetFakes();
        factory.CompanyApi.Respond = _ =>
        {
            var body = JsonNode.Parse("""{ "ready": false }""")!;
            return new CompanyApiResult(200, body, body.ToJsonString(), new Dictionary<string, string>());
        };

        var scenarioId = await factory.InsertScenarioAsync(
            $"timeout-{Guid.NewGuid():N}", TestScenarioKind.Generic, false,
            new PollStep
            {
                Key = "wait", Title = "wait",
                IntervalMs = 60, TimeoutMs = 250,
                Read = new PollRead { Http = new HttpStepRequest { Method = "GET", Endpoint = "companyApi:orders", Path = "/s" } },
                Until = new Assertion { JsonPath = "$.ready", Op = AssertionOp.Equals, Value = JsonValue.Create(true) },
            });

        var client = factory.Client();
        var run = await factory.PollUntilTerminalAsync(client, await StartAsync(client, scenarioId));

        Assert.Equal("failed", (string?)run["status"]);
        Assert.Equal("failed", (string?)run["steps"]!.AsArray()[0]!["status"]);
    }

    [Fact]
    public async Task Failed_assertion_fails_the_run_and_skips_remaining_steps()
    {
        factory.ResetFakes();
        var scenarioId = await factory.InsertScenarioAsync(
            $"assertfail-{Guid.NewGuid():N}", TestScenarioKind.Generic, false,
            Http("call"),
            new AssertStep
            {
                Key = "bad", Title = "bad",
                Expect = new Assertion { JsonPath = "$.missing", Op = AssertionOp.Exists },
            },
            new DelayStep { Key = "tail", Title = "tail", Ms = 10 });

        var client = factory.Client();
        var run = await factory.PollUntilTerminalAsync(client, await StartAsync(client, scenarioId));

        Assert.Equal("failed", (string?)run["status"]);
        var steps = run["steps"]!.AsArray();
        Assert.Equal("passed", (string?)steps[0]!["status"]);
        Assert.Equal("failed", (string?)steps[1]!["status"]);
        Assert.Equal("skipped", (string?)steps[2]!["status"]);
    }

    [Fact]
    public async Task Persisted_step_never_contains_a_configured_secret_or_known_auth_header()
    {
        factory.ResetFakes();
        factory.CompanyApi.Respond = _ =>
        {
            var body = JsonNode.Parse("""{ "echo": "config-secret-abcdef", "ok": true }""")!;
            return new CompanyApiResult(200, body, body.ToJsonString(), new Dictionary<string, string>());
        };

        var scenarioId = await factory.InsertScenarioAsync(
            $"mask-{Guid.NewGuid():N}", TestScenarioKind.Generic, false, Http("call"));

        var client = factory.Client();
        var run = await factory.PollUntilTerminalAsync(client, await StartAsync(client, scenarioId));

        var step = run["steps"]!.AsArray()[0]!;
        Assert.Equal("***", (string?)step["request"]!["headers"]!["Authorization"]);
        Assert.Equal("***", (string?)step["response"]!["body"]!["echo"]);
        Assert.DoesNotContain("config-secret-abcdef", run.ToJsonString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Start_returns_503_when_a_required_target_family_is_unconfigured()
    {
        factory.ResetFakes();
        var scenarioId = await factory.InsertScenarioAsync(
            $"nodb-{Guid.NewGuid():N}", TestScenarioKind.Generic, false,
            new DbQueryStep { Key = "q", Title = "q", Query = "SELECT 1 AS ready" });

        var response = await factory.Client("preprod").PostAsJsonAsync(Root, new { scenarioId, runParams = new { } });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task Sse_stream_sends_snapshot_then_step_events_then_run_finished()
    {
        factory.ResetFakes();
        var scenarioId = await factory.InsertScenarioAsync(
            $"sse-{Guid.NewGuid():N}", TestScenarioKind.Generic, false,
            Http("call"),
            new DelayStep { Key = "pause", Title = "pause", Ms = 400 });

        var client = factory.Client();
        var runId = await StartAsync(client, scenarioId);

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var response = await client.GetAsync(
            $"{Root}/{runId}/events?env=dev", HttpCompletionOption.ResponseHeadersRead, cts.Token);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cts.Token);
        using var reader = new StreamReader(stream);
        var events = new List<string>();

        while (!cts.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(cts.Token);
            if (line is null)
            {
                break;
            }

            if (line.StartsWith("event:", StringComparison.Ordinal))
            {
                var name = line["event:".Length..].Trim();
                events.Add(name);
                if (name == "run-finished")
                {
                    break;
                }
            }
        }

        Assert.Equal("snapshot", events[0]);
        Assert.Contains("step-started", events);
        Assert.Contains("step-finished", events);
        Assert.Equal("run-finished", events[^1]);
    }
}
