using System.Text.Json.Nodes;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class JsonPathEvaluatorTests
{
    private static readonly JsonNode Root = JsonNode.Parse("""
        { "order": { "id": "SO-9", "lines": [ { "sku": "A" }, { "sku": "B" } ] }, "ok": true, "count": 7 }
        """)!;

    [Theory]
    [InlineData("$.order.id", "SO-9")]
    [InlineData("$.order.lines[1].sku", "B")]
    [InlineData("$.count", "7")]
    [InlineData("$.ok", "true")]
    public void Resolves_dotted_and_indexed_paths(string path, string expected) =>
        Assert.Equal(expected, JsonPathEvaluator.AsString(JsonPathEvaluator.Evaluate(Root, path)));

    [Theory]
    [InlineData("$.order.missing")]
    [InlineData("$.order.lines[9].sku")]
    [InlineData("$.nope.deep")]
    public void Missing_segments_yield_null(string path) =>
        Assert.Null(JsonPathEvaluator.Evaluate(Root, path));

    [Fact]
    public void Empty_path_returns_root() =>
        Assert.Same(Root, JsonPathEvaluator.Evaluate(Root, null));
}
