using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace PaymentOrderOps.Api.Tests;

public sealed class ServiceHealthCheckEndpointsTests(ServiceHealthApiFactory factory)
    : IClassFixture<ServiceHealthApiFactory>
{
    private const string BaseRoute = "/api/v1/service-health/checks";

    private HttpClient Client(string environment = "dev")
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Environment", environment);
        return client;
    }

    [Fact]
    public async Task List_returns_seeded_builtin_checks_for_the_environment()
    {
        var response = await Client().GetAsync(BaseRoute);
        response.EnsureSuccessStatusCode();

        var items = await response.Content.ReadFromJsonAsync<JsonArray>();
        Assert.NotNull(items);
        Assert.True(items!.Count >= 6);
        Assert.All(items, node => Assert.Equal("dev", (string?)node!["environment"]));

        var gateway = items.First(node => (string?)node!["name"] == "Payment Gateway")!;
        Assert.Equal("payment", (string?)gateway["group"]);
        Assert.Equal("GET", (string?)gateway["method"]);
        Assert.Equal("builtin", (string?)gateway["source"]);
    }

    [Fact]
    public async Task Request_without_environment_header_returns_400()
    {
        var response = await factory.CreateClient().GetAsync(BaseRoute);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal(400, (int?)problem!["status"]);
    }

    [Fact]
    public async Task Request_with_invalid_environment_header_returns_400()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Environment", "staging");
        var response = await client.GetAsync(BaseRoute);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_then_get_roundtrips_the_definition()
    {
        var client = Client();
        var payload = new
        {
            name = "Checkout API",
            group = "custom",
            method = "POST",
            url = $"https://checkout-{Guid.NewGuid():N}.boyner.internal/health",
            headers = new Dictionary<string, string> { ["Authorization"] = "Bearer x" },
            body = "{\"ping\":true}",
            expectedStatus = 204,
        };

        var created = await client.PostAsJsonAsync(BaseRoute, payload);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.NotNull(created.Headers.Location);

        var createdBody = await created.Content.ReadFromJsonAsync<JsonObject>();
        var id = (string?)createdBody!["id"];
        Assert.False(string.IsNullOrWhiteSpace(id));
        Assert.Equal("custom", (string?)createdBody["source"]);
        Assert.Equal("dev", (string?)createdBody["environment"]);
        Assert.Equal(204, (int?)createdBody["expectedStatus"]);
        Assert.Equal("Bearer x", (string?)createdBody["headers"]!["Authorization"]);

        var fetched = await client.GetAsync($"{BaseRoute}/{id}");
        Assert.Equal(HttpStatusCode.OK, fetched.StatusCode);
        var fetchedBody = await fetched.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal("Checkout API", (string?)fetchedBody!["name"]);
    }

    [Fact]
    public async Task Create_duplicate_method_and_url_returns_conflict()
    {
        var client = Client();
        var url = $"https://dupe-{Guid.NewGuid():N}.boyner.internal/health";
        var first = await client.PostAsJsonAsync(BaseRoute, new { name = "First", group = "custom", method = "GET", url });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await client.PostAsJsonAsync(
            BaseRoute,
            new { name = "Second", group = "custom", method = "get", url = url.ToUpperInvariant() + "/" });

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        var problem = await second.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal(409, (int?)problem!["status"]);
    }

    [Fact]
    public async Task Same_method_and_url_can_exist_in_two_environments()
    {
        var url = $"https://cross-env-{Guid.NewGuid():N}.boyner.internal/health";

        var inDev = await Client("dev").PostAsJsonAsync(BaseRoute, new { name = "Dev copy", group = "custom", method = "GET", url });
        var inPreprod = await Client("preprod").PostAsJsonAsync(BaseRoute, new { name = "Preprod copy", group = "custom", method = "GET", url });

        Assert.Equal(HttpStatusCode.Created, inDev.StatusCode);
        Assert.Equal(HttpStatusCode.Created, inPreprod.StatusCode);
    }

    [Fact]
    public async Task Definitions_are_isolated_across_environments()
    {
        var url = $"https://iso-{Guid.NewGuid():N}.boyner.internal/health";
        var created = await Client("dev").PostAsJsonAsync(BaseRoute, new { name = "Dev only", group = "custom", method = "GET", url });
        var id = (string?)(await created.Content.ReadFromJsonAsync<JsonObject>())!["id"];

        var crossGet = await Client("preprod").GetAsync($"{BaseRoute}/{id}");
        Assert.Equal(HttpStatusCode.NotFound, crossGet.StatusCode);

        var crossDelete = await Client("preprod").DeleteAsync($"{BaseRoute}/{id}");
        Assert.Equal(HttpStatusCode.NotFound, crossDelete.StatusCode);

        var preprodList = await Client("preprod").GetFromJsonAsync<JsonArray>(BaseRoute);
        Assert.DoesNotContain(preprodList!, node => (string?)node!["id"] == id);
    }

    [Fact]
    public async Task Create_with_body_environment_mismatching_header_returns_400()
    {
        var response = await Client("dev").PostAsJsonAsync(
            BaseRoute,
            new
            {
                name = "Mismatch",
                group = "custom",
                method = "GET",
                url = $"https://mismatch-{Guid.NewGuid():N}.boyner.internal/health",
                environment = "production",
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonObject>();
        Assert.NotNull(problem!["errors"]!["environment"]);
    }

    [Fact]
    public async Task Create_with_invalid_payload_returns_validation_problem()
    {
        var response = await Client().PostAsJsonAsync(
            BaseRoute,
            new { name = "", group = "custom", method = "GET", url = "not-a-url", expectedStatus = 42 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonObject>();
        Assert.NotNull(problem!["errors"]);
    }

    [Fact]
    public async Task Get_unknown_id_returns_not_found()
    {
        var response = await Client().GetAsync($"{BaseRoute}/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_replaces_the_definition()
    {
        var client = Client();
        var createResponse = await client.PostAsJsonAsync(
            BaseRoute,
            new
            {
                name = "Before",
                group = "custom",
                method = "GET",
                url = $"https://put-{Guid.NewGuid():N}.boyner.internal/health",
            });
        var id = (string?)(await createResponse.Content.ReadFromJsonAsync<JsonObject>())!["id"];

        var updateResponse = await client.PutAsJsonAsync(
            $"{BaseRoute}/{id}",
            new
            {
                name = "After",
                group = "platform",
                method = "HEAD",
                url = $"https://put-{Guid.NewGuid():N}.boyner.internal/alive",
                expectedStatus = 200,
                isEnabled = false,
            });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updatedBody = await updateResponse.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal("After", (string?)updatedBody!["name"]);
        Assert.Equal("platform", (string?)updatedBody["group"]);
        Assert.Equal("HEAD", (string?)updatedBody["method"]);
        Assert.False((bool?)updatedBody["isEnabled"]);
        Assert.Equal("dev", (string?)updatedBody["environment"]);
    }

    [Fact]
    public async Task Delete_soft_deletes_and_hides_the_definition()
    {
        var client = Client();
        var createResponse = await client.PostAsJsonAsync(
            BaseRoute,
            new
            {
                name = "Doomed",
                group = "custom",
                method = "GET",
                url = $"https://delete-{Guid.NewGuid():N}.boyner.internal/health",
            });
        var id = (string?)(await createResponse.Content.ReadFromJsonAsync<JsonObject>())!["id"];

        var deleteResponse = await client.DeleteAsync($"{BaseRoute}/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var fetchResponse = await client.GetAsync($"{BaseRoute}/{id}");
        Assert.Equal(HttpStatusCode.NotFound, fetchResponse.StatusCode);
    }
}
