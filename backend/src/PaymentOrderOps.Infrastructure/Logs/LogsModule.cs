using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace PaymentOrderOps.Infrastructure.Logs;

public static class LogsModule
{
    /// <summary>
    /// Binds the per-environment <c>Logs</c> section and registers the Elasticsearch gateway.
    /// The API-side <c>LogSearchResolver</c> picks the connection block for <c>X-Environment</c>.
    /// </summary>
    public static IServiceCollection AddLogSearch(this IServiceCollection services, IConfiguration configuration)
    {
        var options = new LogSearchOptions();
        foreach (var environmentSection in configuration.GetSection(LogSearchOptions.SectionName).GetChildren())
        {
            options.Environments[environmentSection.Key] = new LogEnvironmentOptions
            {
                Elasticsearch = environmentSection.GetSection("Elasticsearch").Get<ElasticsearchOptions>(),
            };
        }

        services.AddSingleton(options);
        services.AddSingleton<ILogSearchGateway, ElasticLogSearchGateway>();
        return services;
    }
}
