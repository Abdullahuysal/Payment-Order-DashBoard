using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class TestRunScenariosAndProfilesTests(TestRunsApiFactory factory) : IClassFixture<TestRunsApiFactory>
{
    private const string Root = "/api/v1/test-runs";

    [Fact]
    public async Task Missing_environment_header_returns_400()
    {
        var response = await factory.CreateClient().GetAsync($"{Root}/scenarios");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Production_environment_is_rejected_with_400()
    {
        var response = await factory.Client("production").GetAsync($"{Root}/scenarios");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Contains("production", (string?)problem!["title"] ?? "", StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Lists_the_six_seeded_scenarios()
    {
        var scenarios = await factory.Client().GetFromJsonAsync<JsonArray>($"{Root}/scenarios");
        Assert.NotNull(scenarios);
        Assert.Equal(6, scenarios!.Count);
        Assert.Contains(scenarios, s => (string?)s!["key"] == "order-create");
    }

    [Fact]
    public async Task Gets_a_scenario_by_key_with_steps_and_bulk_limits()
    {
        var detail = await factory.Client().GetFromJsonAsync<JsonObject>($"{Root}/scenarios/order-bulk");
        Assert.Equal("order-bulk", (string?)detail!["key"]);
        Assert.True(detail["steps"]!.AsArray().Count >= 1);
        Assert.Equal(10, (int?)detail["bulk"]!["maxCount"]);
        Assert.Equal(5, (int?)detail["bulk"]!["maxConcurrency"]);
    }

    [Fact]
    public async Task Non_bulk_scenario_omits_bulk_limits()
    {
        var detail = await factory.Client().GetFromJsonAsync<JsonObject>($"{Root}/scenarios/order-create");
        Assert.Null(detail!["bulk"]);
    }

    [Fact]
    public async Task Unknown_scenario_returns_404()
    {
        var response = await factory.Client().GetAsync($"{Root}/scenarios/does-not-exist");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Profile_crud_round_trips_and_is_isolated_by_environment()
    {
        var client = factory.Client();
        var name = $"profile-{Guid.NewGuid():N}";

        var created = await client.PostAsJsonAsync(
            $"{Root}/scenarios/order-create/profiles",
            new { name, values = new { productSku = "BOY-1", quantity = 2 } });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var body = await created.Content.ReadFromJsonAsync<JsonObject>();
        var id = (string?)body!["id"];
        Assert.Equal("dev", (string?)body["environment"]);
        Assert.Equal("BOY-1", (string?)body["values"]!["productSku"]);

        var list = await client.GetFromJsonAsync<JsonArray>($"{Root}/scenarios/order-create/profiles");
        Assert.Contains(list!, p => (string?)p!["id"] == id);

        var preprodList = await factory.Client("preprod").GetFromJsonAsync<JsonArray>($"{Root}/scenarios/order-create/profiles");
        Assert.DoesNotContain(preprodList!, p => (string?)p!["id"] == id);

        var updated = await client.PutAsJsonAsync(
            $"{Root}/scenarios/order-create/profiles/{id}",
            new { name, values = new { productSku = "BOY-2" } });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        Assert.Equal("BOY-2", (string?)(await updated.Content.ReadFromJsonAsync<JsonObject>())!["values"]!["productSku"]);

        var deleted = await client.DeleteAsync($"{Root}/scenarios/order-create/profiles/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
    }

    [Fact]
    public async Task Duplicate_profile_name_in_same_scenario_and_environment_returns_409()
    {
        var client = factory.Client();
        var name = $"dupe-{Guid.NewGuid():N}";
        var first = await client.PostAsJsonAsync($"{Root}/scenarios/retail-invoice/profiles", new { name, values = new { } });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await client.PostAsJsonAsync(
            $"{Root}/scenarios/retail-invoice/profiles", new { name = name.ToUpperInvariant(), values = new { } });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Stale_row_version_on_put_returns_409()
    {
        var client = factory.Client();
        var name = $"rv-{Guid.NewGuid():N}";
        var created = await client.PostAsJsonAsync($"{Root}/scenarios/retail-invoice/profiles", new { name, values = new { } });
        var body = await created.Content.ReadFromJsonAsync<JsonObject>();
        var id = (string?)body!["id"];
        var rowVersion = (string?)body["rowVersion"];

        var ok = await client.PutAsJsonAsync(
            $"{Root}/scenarios/retail-invoice/profiles/{id}", new { name, values = new { a = 1 }, rowVersion });
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);

        var stale = await client.PutAsJsonAsync(
            $"{Root}/scenarios/retail-invoice/profiles/{id}", new { name, values = new { a = 2 }, rowVersion });
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
    }
}
