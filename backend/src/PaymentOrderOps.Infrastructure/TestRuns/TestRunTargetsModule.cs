using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace PaymentOrderOps.Infrastructure.TestRuns;

public static class TestRunTargetsModule
{
    public static IServiceCollection AddTestRunTargets(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton(_ => BindTargets(configuration));
        services.AddSingleton(_ =>
            configuration.GetSection(TestRunsOptions.SectionName).Get<TestRunsOptions>() ?? new TestRunsOptions());

        if (services.All(descriptor => descriptor.ServiceType != typeof(TimeProvider)))
        {
            services.AddSingleton(TimeProvider.System);
        }

        services.AddSingleton<ITokenBroker, TokenBroker>();
        services.AddSingleton<ICompanyApiGateway, CompanyApiGateway>();
        services.AddSingleton<ISoapServiceGateway, SoapServiceGateway>();
        services.AddSingleton<ICompanyDbReader, SqlServerCompanyDbReader>();

        return services;
    }

    private static TestRunTargetsOptions BindTargets(IConfiguration configuration)
    {
        var options = new TestRunTargetsOptions();

        foreach (var environment in EnvironmentKeys(configuration))
        {
            var companyApis = new Dictionary<string, CompanyApiEndpointOptions>(StringComparer.OrdinalIgnoreCase);
            foreach (var api in configuration.GetSection($"{TestRunTargetsOptions.CompanyApisSection}:{environment}").GetChildren())
            {
                companyApis[api.Key] = api.Get<CompanyApiEndpointOptions>() ?? new CompanyApiEndpointOptions();
            }

            var soapServices = new Dictionary<string, SoapServiceEndpointOptions>(StringComparer.OrdinalIgnoreCase);
            foreach (var soap in configuration.GetSection($"{TestRunTargetsOptions.SoapServicesSection}:{environment}").GetChildren())
            {
                soapServices[soap.Key] = soap.Get<SoapServiceEndpointOptions>() ?? new SoapServiceEndpointOptions();
            }

            var auth = new Dictionary<string, AuthProviderOptions>(StringComparer.OrdinalIgnoreCase);
            foreach (var provider in configuration.GetSection($"{TestRunTargetsOptions.AuthSection}:{environment}").GetChildren())
            {
                auth[provider.Key] = provider.Get<AuthProviderOptions>() ?? new AuthProviderOptions();
            }

            options.Environments[environment] = new EnvironmentTargets
            {
                CompanyApis = companyApis,
                SoapServices = soapServices,
                CompanyDb = configuration.GetSection($"{TestRunTargetsOptions.CompanyDbSection}:{environment}").Get<CompanyDbOptions>(),
                Auth = auth,
            };
        }

        return options;
    }

    private static IEnumerable<string> EnvironmentKeys(IConfiguration configuration)
    {
        var keys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var section in new[]
                 {
                     TestRunTargetsOptions.CompanyApisSection,
                     TestRunTargetsOptions.SoapServicesSection,
                     TestRunTargetsOptions.CompanyDbSection,
                     TestRunTargetsOptions.AuthSection,
                 })
        {
            foreach (var child in configuration.GetSection(section).GetChildren())
            {
                keys.Add(child.Key);
            }
        }

        return keys;
    }
}
