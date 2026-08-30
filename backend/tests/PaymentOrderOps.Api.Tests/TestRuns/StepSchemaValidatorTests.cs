using System.Text.Json.Nodes;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Domain.TestRuns;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class StepSchemaValidatorTests
{
    [Fact]
    public void Accepts_a_well_formed_step_list()
    {
        var steps = new ScenarioStep[]
        {
            new HttpRequestStep
            {
                Key = "call", Title = "Call",
                Request = new HttpStepRequest { Method = "POST", Endpoint = "companyApi:orders", Path = "/x" },
            },
            new ExtractStep
            {
                Key = "grab", Title = "Grab", From = "call",
                Map = new Dictionary<string, string> { ["orderNo"] = "$.orderNo" },
            },
            new AssertStep
            {
                Key = "check", Title = "Check",
                Expect = new Assertion { JsonPath = "$.orderNo", Op = AssertionOp.Exists },
            },
        };

        Assert.Empty(StepSchemaValidator.Validate(steps));
    }

    [Fact]
    public void Flags_bad_endpoint_prefix_and_unknown_extract_source()
    {
        var steps = new ScenarioStep[]
        {
            new HttpRequestStep
            {
                Key = "call", Title = "Call",
                Request = new HttpStepRequest { Method = "POST", Endpoint = "https://evil.example/x" },
            },
            new ExtractStep
            {
                Key = "grab", Title = "Grab", From = "missing",
                Map = new Dictionary<string, string> { ["v"] = "$.v" },
            },
        };

        var errors = StepSchemaValidator.Validate(steps);
        Assert.Contains(errors, e => e.Contains("request.endpoint", StringComparison.Ordinal));
        Assert.Contains(errors, e => e.Contains("extract.from", StringComparison.Ordinal));
    }

    [Fact]
    public void Flags_non_read_only_db_query_and_null_step()
    {
        var steps = new ScenarioStep?[]
        {
            new DbQueryStep { Key = "q", Title = "Q", Query = "DELETE FROM x" },
            null,
        };

        var errors = StepSchemaValidator.Validate(steps);
        Assert.Contains(errors, e => e.Contains("not read-only", StringComparison.Ordinal));
        Assert.Contains(errors, e => e.Contains("unknown", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Flags_duplicate_keys()
    {
        var steps = new ScenarioStep[]
        {
            new DelayStep { Key = "dup", Title = "A", Ms = 1 },
            new DelayStep { Key = "dup", Title = "B", Ms = 1 },
        };

        Assert.Contains(StepSchemaValidator.Validate(steps), e => e.Contains("duplicate key", StringComparison.Ordinal));
    }
}
