using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace PaymentOrderOps.Api.Tests.Todo;

public sealed class TodoEndpointsTests(TodoApiFactory factory) : IClassFixture<TodoApiFactory>
{
    private const string Root = "/api/v1/todo";

    private async Task<string> CreateOwnerAsync(HttpClient client, string? name = null)
    {
        var response = await client.PostAsJsonAsync($"{Root}/owners", new { name = name ?? $"owner-{Guid.NewGuid():N}" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonObject>();
        return (string)body!["id"]!;
    }

    [Fact]
    public async Task Create_owner_returns_201_and_appears_in_list_sorted_by_name()
    {
        var client = factory.CreateClient();
        var zebra = $"zzz-{Guid.NewGuid():N}";
        var apple = $"aaa-{Guid.NewGuid():N}";

        await client.PostAsJsonAsync($"{Root}/owners", new { name = $"  {zebra}  " });
        await client.PostAsJsonAsync($"{Root}/owners", new { name = apple });

        var owners = await client.GetFromJsonAsync<JsonArray>($"{Root}/owners");
        Assert.NotNull(owners);
        var names = owners!.Select(o => (string?)o!["name"]).ToList();
        Assert.Contains(zebra, names);
        Assert.Contains(apple, names);
        Assert.Equal(names.OrderBy(n => n, StringComparer.OrdinalIgnoreCase), names);
    }

    [Fact]
    public async Task Duplicate_owner_name_is_case_insensitive_and_returns_409()
    {
        var client = factory.CreateClient();
        var name = $"dupe-{Guid.NewGuid():N}";
        var first = await client.PostAsJsonAsync($"{Root}/owners", new { name });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await client.PostAsJsonAsync($"{Root}/owners", new { name = name.ToUpperInvariant() });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        var problem = await second.Content.ReadFromJsonAsync<JsonObject>();
        Assert.False(string.IsNullOrWhiteSpace((string?)problem!["title"]));
    }

    [Fact]
    public async Task Create_owner_with_blank_name_returns_400()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync($"{Root}/owners", new { name = "   " });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_item_with_unknown_owner_returns_404()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync(
            $"{Root}/items",
            new { title = "orphan", ownerId = Guid.NewGuid(), status = "todo", priority = "low" });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Create_item_returns_201_with_owner_name_and_kebab_case_enums()
    {
        var client = factory.CreateClient();
        var ownerName = $"kebab-{Guid.NewGuid():N}";
        var ownerId = await CreateOwnerAsync(client, ownerName);

        var created = await client.PostAsJsonAsync(
            $"{Root}/items",
            new
            {
                title = "ship it",
                description = "with detail",
                ownerId,
                status = "in-progress",
                priority = "high",
                dueDate = "2026-09-15",
            });

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var body = await created.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal("ship it", (string?)body!["title"]);
        Assert.Equal("with detail", (string?)body["description"]);
        Assert.Equal(ownerId, (string?)body["ownerId"]);
        Assert.Equal(ownerName, (string?)body["ownerName"]);
        Assert.Equal("in-progress", (string?)body["status"]);
        Assert.Equal("high", (string?)body["priority"]);
        Assert.Equal("2026-09-15", (string?)body["dueDate"]);
        Assert.False(string.IsNullOrWhiteSpace((string?)body["createdAt"]));
        Assert.False(string.IsNullOrWhiteSpace((string?)body["updatedAt"]));
    }

    [Fact]
    public async Task List_items_filters_by_owner_and_status_and_orders_by_status_then_priority()
    {
        var client = factory.CreateClient();
        var ownerId = await CreateOwnerAsync(client);

        await client.PostAsJsonAsync($"{Root}/items", new { title = "done-high", ownerId, status = "done", priority = "high" });
        await client.PostAsJsonAsync($"{Root}/items", new { title = "todo-low", ownerId, status = "todo", priority = "low" });
        await client.PostAsJsonAsync($"{Root}/items", new { title = "todo-high", ownerId, status = "todo", priority = "high" });
        await client.PostAsJsonAsync($"{Root}/items", new { title = "prog-medium", ownerId, status = "in-progress", priority = "medium" });

        var all = await client.GetFromJsonAsync<JsonArray>($"{Root}/items?ownerId={ownerId}");
        var titles = all!.Select(i => (string?)i!["title"]).ToList();
        Assert.Equal(new[] { "todo-high", "todo-low", "prog-medium", "done-high" }, titles);

        var todos = await client.GetFromJsonAsync<JsonArray>($"{Root}/items?ownerId={ownerId}&status=todo");
        Assert.Equal(2, todos!.Count);
        Assert.All(todos!, i => Assert.Equal("todo", (string?)i!["status"]));
    }

    [Fact]
    public async Task List_items_with_invalid_status_returns_400()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync($"{Root}/items?status=archived");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Update_item_replaces_fields_and_unknown_id_returns_404()
    {
        var client = factory.CreateClient();
        var ownerId = await CreateOwnerAsync(client);
        var otherOwnerId = await CreateOwnerAsync(client);

        var created = await client.PostAsJsonAsync(
            $"{Root}/items", new { title = "before", ownerId, status = "todo", priority = "low" });
        var id = (string?)(await created.Content.ReadFromJsonAsync<JsonObject>())!["id"];

        var updated = await client.PutAsJsonAsync(
            $"{Root}/items/{id}",
            new { title = "after", ownerId = otherOwnerId, status = "done", priority = "high" });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var body = await updated.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal("after", (string?)body!["title"]);
        Assert.Equal("done", (string?)body["status"]);
        Assert.Equal(otherOwnerId, (string?)body["ownerId"]);

        var missing = await client.PutAsJsonAsync(
            $"{Root}/items/{Guid.NewGuid()}",
            new { title = "x", ownerId, status = "todo", priority = "low" });
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task Delete_item_returns_204_then_404()
    {
        var client = factory.CreateClient();
        var ownerId = await CreateOwnerAsync(client);
        var created = await client.PostAsJsonAsync(
            $"{Root}/items", new { title = "temp", ownerId, status = "todo", priority = "low" });
        var id = (string?)(await created.Content.ReadFromJsonAsync<JsonObject>())!["id"];

        var deleted = await client.DeleteAsync($"{Root}/items/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);

        var again = await client.DeleteAsync($"{Root}/items/{id}");
        Assert.Equal(HttpStatusCode.NotFound, again.StatusCode);
    }
}
