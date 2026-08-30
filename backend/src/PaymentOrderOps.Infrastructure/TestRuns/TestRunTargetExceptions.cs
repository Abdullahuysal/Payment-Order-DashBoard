namespace PaymentOrderOps.Infrastructure.TestRuns;

/// <summary>No configuration exists for a company target in the run's environment (→ 503).</summary>
public sealed class TestRunTargetNotConfiguredException(string targetKind, string reference, string environment)
    : Exception($"{targetKind} '{reference}' is not configured for the '{environment}' environment.")
{
    public string TargetKind { get; } = targetKind;

    public string Reference { get; } = reference;

    public string Environment { get; } = environment;
}

/// <summary>A configured company target could not be reached or answered with a transport error (→ 502).</summary>
public sealed class TestRunTargetUnreachableException(
    string targetKind, string reference, string reason, Exception? innerException = null)
    : Exception($"{targetKind} '{reference}' could not be reached: {reason}", innerException)
{
    public string TargetKind { get; } = targetKind;

    public string Reference { get; } = reference;
}
