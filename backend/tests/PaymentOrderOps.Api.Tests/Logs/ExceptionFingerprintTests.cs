using PaymentOrderOps.Infrastructure.Logs;
using Xunit;

namespace PaymentOrderOps.Api.Tests.Logs;

public sealed class ExceptionFingerprintTests
{
    [Fact]
    public void Messages_differing_only_by_numbers_guids_and_dates_share_a_fingerprint()
    {
        var a = ExceptionFingerprint.Compute(
            "System.InvalidOperationException",
            "Order 4821 for 3f2504e0-4f89-11d3-9a0c-0305e82c3301 failed at 2026-08-30T12:00:00Z",
            "at Orders.Handler.Run()");

        var b = ExceptionFingerprint.Compute(
            "System.InvalidOperationException",
            "Order 99 for 11111111-2222-3333-4444-555555555555 failed at 2026-01-02 08:15",
            "at Orders.Handler.Run()");

        Assert.Equal(a, b);
    }

    [Fact]
    public void Different_exception_type_or_top_frame_yields_a_different_fingerprint()
    {
        var baseline = ExceptionFingerprint.Compute("System.TimeoutException", "boom", "at A.B()");

        Assert.NotEqual(baseline, ExceptionFingerprint.Compute("System.OperationCanceledException", "boom", "at A.B()"));
        Assert.NotEqual(baseline, ExceptionFingerprint.Compute("System.TimeoutException", "boom", "at A.C()"));
    }

    [Fact]
    public void NormalizeMessage_collapses_volatile_tokens_to_star()
    {
        Assert.Equal("order * not found", ExceptionFingerprint.NormalizeMessage("order 12345 not found"));
        Assert.Equal(
            "user * missing",
            ExceptionFingerprint.NormalizeMessage("user 3f2504e0-4f89-11d3-9a0c-0305e82c3301 missing"));
    }

    [Fact]
    public void TopFrame_returns_the_first_at_line()
    {
        var stack = "System.Exception: nope\n   at Foo.Bar()\n   at Foo.Baz()";
        Assert.Equal("at Foo.Bar()", ExceptionFingerprint.TopFrame(stack));
    }

    [Fact]
    public void TopFrame_is_null_for_blank_input() => Assert.Null(ExceptionFingerprint.TopFrame("   "));
}
