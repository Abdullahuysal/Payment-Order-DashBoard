using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>
/// Request-/run-scoped: picks the company-target block for the current <c>X-Environment</c>
/// (the background worker sets the same ambient context per run). Mirrors
/// <c>MessageBrokerResolver</c>: <c>Require*</c> throws
/// <see cref="TestRunTargetNotConfiguredException"/> (→ 503) when nothing is configured.
/// </summary>
public sealed class TestRunTargetResolver(TestRunTargetsOptions options, IEnvironmentContext environment)
{
    public string EnvironmentName => environment.Environment.ToString();

    private EnvironmentTargets? Targets => options.For(EnvironmentName);

    public bool HasCompanyApiFamily => Targets?.HasCompanyApis == true;

    public bool HasSoapFamily => Targets?.HasSoapServices == true;

    public bool HasCompanyDbFamily => Targets?.HasCompanyDb == true;

    public (string Reference, CompanyApiEndpointOptions Target) RequireCompanyApi(string endpointRef)
    {
        var name = StripPrefix(endpointRef, "companyApi:");
        var target = Targets?.CompanyApis.GetValueOrDefault(name);
        if (target is not { IsConfigured: true })
        {
            throw new TestRunTargetNotConfiguredException("companyApi", name, EnvironmentName);
        }

        return (name, target);
    }

    public (string Reference, SoapServiceEndpointOptions Target) RequireSoap(string endpointRef)
    {
        var name = StripPrefix(endpointRef, "soap:");
        var target = Targets?.SoapServices.GetValueOrDefault(name);
        if (target is not { IsConfigured: true })
        {
            throw new TestRunTargetNotConfiguredException("soap", name, EnvironmentName);
        }

        return (name, target);
    }

    public CompanyDbOptions RequireCompanyDb()
    {
        var target = Targets?.CompanyDb;
        if (target is not { IsConfigured: true })
        {
            throw new TestRunTargetNotConfiguredException("companyDb", "default", EnvironmentName);
        }

        return target;
    }

    public IReadOnlyCollection<string> ConfiguredAuthHeaderNames() =>
        Targets is null
            ? []
            : [.. Targets.Auth.Values
                .Select(a => a.Header)
                .Where(header => !string.IsNullOrWhiteSpace(header))
                .Select(header => header!)
                .Distinct(StringComparer.OrdinalIgnoreCase)];

    public IReadOnlyCollection<string> ConfiguredStaticSecrets() =>
        Targets is null
            ? []
            : [.. Targets.Auth.Values
                .Where(a => string.Equals(a.Kind, "static", StringComparison.OrdinalIgnoreCase))
                .Select(a => a.Value)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value!)];

    private static string StripPrefix(string reference, string prefix) =>
        reference.StartsWith(prefix, StringComparison.Ordinal)
            ? reference[prefix.Length..]
            : reference;
}
