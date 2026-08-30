namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;

/// <summary>
/// Transport settings for the outbound probe requests, bound from the
/// <c>ServiceHealthProbe</c> configuration section.
/// </summary>
public sealed class ServiceHealthProbeOptions
{
    public const string SectionName = "ServiceHealthProbe";

    /// <summary>Per-check deadline. The probe never blocks longer than this, redirects included.</summary>
    public int TimeoutSeconds { get; set; } = 10;

    /// <summary>How many checks the batch slice may probe at the same time.</summary>
    public int MaxConcurrency { get; set; } = 8;

    /// <summary>
    /// When non-empty, a target host must match one of these entries (exact host or
    /// <c>.suffix</c> match). Empty means "any host", which is the default because the
    /// dashboard's whole purpose is probing internal services.
    /// </summary>
    public string[] AllowedHosts { get; set; } = [];

    /// <summary>Hosts that are always rejected, evaluated after <see cref="AllowedHosts"/>.</summary>
    public string[] BlockedHosts { get; set; } = [];
}
