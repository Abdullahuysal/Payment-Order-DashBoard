namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;

/// <summary>Outcome of one executed probe.</summary>
public enum ServiceHealthProbeStatus
{
    /// <summary>The target answered with exactly the expected status code.</summary>
    Up,

    /// <summary>The target answered, but with a different status code than expected.</summary>
    Down,

    /// <summary>The request never produced a response (DNS, TLS, connection, timeout).</summary>
    Error,

    /// <summary>The check is disabled and was not executed.</summary>
    Skipped,
}

/// <summary>Wire shape returned by the run slices — one entry per executed check.</summary>
public sealed record ServiceHealthProbeResponse(
    Guid CheckId,
    string Name,
    ServiceHealthProbeStatus Status,
    string Method,
    string Url,
    int ExpectedStatus,
    int? HttpStatus,
    long DurationMs,
    string? Error,
    DateTime CheckedAt);

/// <summary>Wire shape returned when every check in the environment is probed at once.</summary>
public sealed record ServiceHealthProbeBatchResponse(
    int Total,
    int Up,
    int Down,
    int Error,
    int Skipped,
    DateTime CheckedAt,
    IReadOnlyList<ServiceHealthProbeResponse> Results);
