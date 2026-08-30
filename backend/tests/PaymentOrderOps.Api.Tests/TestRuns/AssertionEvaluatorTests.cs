using System.Text.Json.Nodes;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Domain.TestRuns;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class AssertionEvaluatorTests
{
    private static readonly JsonNode Body = JsonNode.Parse("""
        { "status": "CREATED", "amount": 125.5, "ready": true, "note": "order accepted" }
        """)!;

    private static Assertion A(AssertionOp op, string path, JsonNode? value = null) =>
        new() { JsonPath = path, Op = op, Value = value };

    [Fact]
    public void Equals_matches_string() =>
        Assert.True(Eval(A(AssertionOp.Equals, "$.status", JsonValue.Create("CREATED"))));

    [Fact]
    public void Equals_coerces_numbers() =>
        Assert.True(Eval(A(AssertionOp.Equals, "$.amount", JsonValue.Create("125.5"))));

    [Fact]
    public void NotEquals_is_the_inverse() =>
        Assert.True(Eval(A(AssertionOp.NotEquals, "$.status", JsonValue.Create("SHIPPED"))));

    [Fact]
    public void Contains_is_case_insensitive_substring() =>
        Assert.True(Eval(A(AssertionOp.Contains, "$.note", JsonValue.Create("ACCEPTED"))));

    [Fact]
    public void Exists_is_true_for_present_and_false_for_absent()
    {
        Assert.True(Eval(A(AssertionOp.Exists, "$.ready")));
        Assert.False(Eval(A(AssertionOp.Exists, "$.missing")));
    }

    [Theory]
    [InlineData(AssertionOp.Gt, "100", true)]
    [InlineData(AssertionOp.Gt, "200", false)]
    [InlineData(AssertionOp.Lt, "200", true)]
    [InlineData(AssertionOp.Lt, "10", false)]
    public void Gt_and_lt_compare_numerically(AssertionOp op, string bound, bool expected) =>
        Assert.Equal(expected, Eval(A(op, "$.amount", JsonValue.Create(bound))));

    [Fact]
    public void Column_selector_reads_a_row()
    {
        var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase) { ["state"] = "shipped" };
        var assertion = new Assertion { Column = "state", Op = AssertionOp.Equals, Value = JsonValue.Create("shipped") };
        Assert.True(AssertionEvaluator.Evaluate(assertion, AssertionContext.ForRow(row)).Passed);
    }

    private static bool Eval(Assertion assertion) =>
        AssertionEvaluator.Evaluate(assertion, AssertionContext.ForJson(Body)).Passed;
}
