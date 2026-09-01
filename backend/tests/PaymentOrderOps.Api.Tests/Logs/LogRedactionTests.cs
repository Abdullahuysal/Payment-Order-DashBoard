using PaymentOrderOps.Infrastructure.Logs;
using Xunit;

namespace PaymentOrderOps.Api.Tests.Logs;

public sealed class LogRedactionTests
{
    [Fact]
    public void Named_fields_are_masked_wholesale()
    {
        var fields = new Dictionary<string, string>
        {
            ["user.email"] = "alice@example.com",
            ["http.request.headers.authorization"] = "Bearer abc.def.ghi",
            ["message"] = "ok",
        };

        var result = LogRedaction.ApplyToFields(fields, ["user.email", "http.request.headers.authorization"]);

        Assert.Equal(LogRedaction.Mask, result["user.email"]);
        Assert.Equal(LogRedaction.Mask, result["http.request.headers.authorization"]);
        Assert.Equal("ok", result["message"]);
    }

    [Fact]
    public void General_mask_rewrites_secret_looking_substrings_in_unlisted_fields()
    {
        var fields = new Dictionary<string, string>
        {
            ["message"] = "calling api with api_key=SUPERSECRETVALUE123 and Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig",
        };

        var result = LogRedaction.ApplyToFields(fields, []);

        Assert.DoesNotContain("SUPERSECRETVALUE123", result["message"]);
        Assert.DoesNotContain("eyJhbGciOiJIUzI1NiJ9", result["message"]);
        Assert.Contains(LogRedaction.Mask, result["message"]);
    }

    [Fact]
    public void MaskSecrets_leaves_ordinary_text_untouched()
    {
        const string text = "order 42 completed for customer bob";
        Assert.Equal(text, LogRedaction.MaskSecrets(text));
    }

    [Fact]
    public void MaskSecrets_masks_long_hex_and_base64_blobs()
    {
        var hex = new string('a', 64);
        Assert.Equal(LogRedaction.Mask, LogRedaction.MaskSecrets(hex));
    }

    [Fact]
    public void IsRedacted_is_case_insensitive_and_trims()
    {
        Assert.True(LogRedaction.IsRedacted("service.name", [" Service.Name "]));
        Assert.False(LogRedaction.IsRedacted("service.name", ["service.version"]));
    }
}
