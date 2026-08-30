using System.Text.Json.Nodes;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class TemplateEngineTests
{
    private static Dictionary<string, JsonNode?> Bag(params (string Key, JsonNode? Value)[] entries)
    {
        var bag = new Dictionary<string, JsonNode?>(StringComparer.Ordinal);
        foreach (var (key, value) in entries)
        {
            bag[key] = value;
        }

        return bag;
    }

    [Fact]
    public void Renders_flat_variable()
    {
        var result = TemplateEngine.Render("order {{orderNo}} done", Bag(("orderNo", JsonValue.Create("SO-42"))));
        Assert.Equal("order SO-42 done", result);
    }

    [Fact]
    public void Renders_nested_path()
    {
        var bag = Bag(("customer", JsonNode.Parse("""{"id":"1002453"}""")));
        Assert.Equal("id=1002453", TemplateEngine.Render("id={{customer.id}}", bag));
    }

    [Fact]
    public void Missing_variable_throws()
    {
        var ex = Assert.Throws<TemplateBindingException>(() =>
            TemplateEngine.Render("{{nope}}", Bag(("orderNo", JsonValue.Create("x")))));
        Assert.Equal("nope", ex.Variable);
    }

    [Fact]
    public void Whole_string_placeholder_keeps_json_type()
    {
        var bag = Bag(("count", JsonValue.Create(3)));
        var node = TemplateEngine.Render((JsonNode?)JsonValue.Create("{{count}}"), bag);
        Assert.Equal(3, node!.GetValue<int>());
    }

    [Fact]
    public void Object_body_is_rendered_recursively()
    {
        var bag = Bag(("sku", JsonValue.Create("BOY-1")));
        var body = JsonNode.Parse("""{"item":"{{sku}}","qty":1}""");
        var rendered = TemplateEngine.Render(body, bag)!;
        Assert.Equal("BOY-1", (string?)rendered["item"]);
        Assert.Equal(1, (int)rendered["qty"]!);
    }
}
