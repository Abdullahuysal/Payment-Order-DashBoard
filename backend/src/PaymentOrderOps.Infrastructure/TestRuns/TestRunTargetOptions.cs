namespace PaymentOrderOps.Infrastructure.TestRuns;

/// <summary>
/// Bound from <c>CompanyApis</c> / <c>SoapServices</c> / <c>CompanyDb</c> / <c>Auth</c>, one
/// block per logical environment (<c>Dev</c> / <c>Preprod</c> / <c>Production</c>). A missing
/// block or a blank required field means "not configured for that environment"; the Api-side
/// <c>TestRunTargetResolver</c> turns that into a <c>503</c>. Secrets arrive via environment
/// variables / user-secrets today (<c>Auth__Dev__&lt;ref&gt;__Value</c>), Vault later — same key path.
/// </summary>
public sealed class TestRunTargetsOptions
{
    public const string CompanyApisSection = "CompanyApis";
    public const string SoapServicesSection = "SoapServices";
    public const string CompanyDbSection = "CompanyDb";
    public const string AuthSection = "Auth";

    public Dictionary<string, EnvironmentTargets> Environments { get; init; } =
        new(StringComparer.OrdinalIgnoreCase);

    public EnvironmentTargets? For(string environment) =>
        Environments.TryGetValue(environment, out var value) ? value : null;
}

public sealed class EnvironmentTargets
{
    public Dictionary<string, CompanyApiEndpointOptions> CompanyApis { get; init; } =
        new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, SoapServiceEndpointOptions> SoapServices { get; init; } =
        new(StringComparer.OrdinalIgnoreCase);

    public CompanyDbOptions? CompanyDb { get; init; }

    public Dictionary<string, AuthProviderOptions> Auth { get; init; } =
        new(StringComparer.OrdinalIgnoreCase);

    public bool HasCompanyApis => CompanyApis.Count > 0;

    public bool HasSoapServices => SoapServices.Count > 0;

    public bool HasCompanyDb => CompanyDb is { } db && !string.IsNullOrWhiteSpace(db.ConnectionString);
}

public sealed class CompanyApiEndpointOptions
{
    public string BaseUrl { get; init; } = string.Empty;

    public string? AuthRef { get; init; }

    public int TimeoutSeconds { get; init; } = 30;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(BaseUrl);
}

public sealed class SoapServiceEndpointOptions
{
    public string Endpoint { get; init; } = string.Empty;

    public string? AuthRef { get; init; }

    public string? DefaultSoapAction { get; init; }

    public int TimeoutSeconds { get; init; } = 30;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Endpoint);
}

public sealed class CompanyDbOptions
{
    /// <summary>A SQL Server connection string; the account should hold only <c>db_datareader</c>.</summary>
    public string ConnectionString { get; init; } = string.Empty;

    public int CommandTimeoutSeconds { get; init; } = 15;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ConnectionString);
}

public sealed class AuthProviderOptions
{
    /// <summary><c>none</c> | <c>static</c> | <c>tokenEndpoint</c> | <c>serviceHeader</c>.</summary>
    public string Kind { get; init; } = "none";

    public string? Header { get; init; }

    public string? Value { get; init; }

    public string? Url { get; init; }

    public string? Method { get; init; }

    public string? BodyTemplate { get; init; }

    public string? TokenPath { get; init; }

    public string? ValuePath { get; init; }

    public string? Format { get; init; }

    public int TtlSeconds { get; init; } = 300;
}

/// <summary>Bound from the <c>TestRuns</c> section.</summary>
public sealed class TestRunsOptions
{
    public const string SectionName = "TestRuns";

    public string[] AllowedEnvironments { get; init; } = ["dev", "preprod"];

    public int MaxBulkCount { get; init; } = 10;

    public int MaxBulkConcurrency { get; init; } = 5;
}
