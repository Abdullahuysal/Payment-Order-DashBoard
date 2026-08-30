using System.Text.Json.Nodes;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class SecretMaskerTests
{
    [Fact]
    public void Masks_known_sensitive_headers()
    {
        var masker = new SecretMasker();
        var node = JsonNode.Parse("""{ "headers": { "Authorization": "Bearer abc", "Accept": "application/json" } }""");

        var redacted = masker.Redact(node)!;

        Assert.Equal("***", (string?)redacted["headers"]!["Authorization"]);
        Assert.Equal("application/json", (string?)redacted["headers"]!["Accept"]);
    }

    [Fact]
    public void Masks_configured_auth_header_name_and_secret_literal()
    {
        var masker = new SecretMasker(["X-Company-Token"], ["super-secret-value"]);
        var node = JsonNode.Parse("""
            { "headers": { "X-Company-Token": "abc" }, "body": { "note": "uses super-secret-value inline" } }
            """);

        var redacted = masker.Redact(node)!;

        Assert.Equal("***", (string?)redacted["headers"]!["X-Company-Token"]);
        Assert.Equal("uses *** inline", (string?)redacted["body"]!["note"]);
    }

    [Fact]
    public void With_adds_runtime_resolved_tokens()
    {
        var masker = new SecretMasker().With("runtime-token-1234");
        Assert.Equal("value=***", masker.MaskText("value=runtime-token-1234"));
    }
}
