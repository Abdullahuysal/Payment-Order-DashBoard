using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using PaymentOrderOps.Infrastructure.Ai;
using PaymentOrderOps.Infrastructure.Logs;
using PaymentOrderOps.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
using Xunit;

namespace PaymentOrderOps.Api.Tests.Logs;

public sealed class LogsApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder("postgres:17-alpine").Build();

    public FakeLogSearchGateway LogSearch { get; } = new();

    public FakeAiSummarizer Summarizer { get; } = new();

    public async Task InitializeAsync()
    {
        await _database.StartAsync();

        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await context.Database.MigrateAsync();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _database.DisposeAsync();
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _database.GetConnectionString(),
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<ILogSearchGateway>();
            services.AddSingleton<ILogSearchGateway>(LogSearch);

            services.RemoveAll<IAiSummarizer>();
            services.AddSingleton<IAiSummarizer>(Summarizer);

            // Dev + Preprod have Elasticsearch configured; Production is left blank (→ 503).
            services.RemoveAll<LogSearchOptions>();
            services.AddSingleton(BuildLogSearchOptions());

            // Only Dev has an Anthropic API key; Preprod is left blank (→ 503).
            services.RemoveAll<AiSummaryOptions>();
            services.AddSingleton(BuildAiOptions());
        });
    }

    private static LogSearchOptions BuildLogSearchOptions()
    {
        var configured = new LogEnvironmentOptions
        {
            Elasticsearch = new ElasticsearchOptions { Uri = "http://es.test:9200", IndexPattern = "logs-*" },
        };

        return new LogSearchOptions
        {
            Environments =
            {
                ["Dev"] = configured,
                ["Preprod"] = configured,
                ["Production"] = new LogEnvironmentOptions { Elasticsearch = new ElasticsearchOptions() },
            },
        };
    }

    private static AiSummaryOptions BuildAiOptions() => new()
    {
        Environments =
        {
            ["Dev"] = new AnthropicOptions { ApiKey = "test-key", Model = "test-model" },
            ["Preprod"] = new AnthropicOptions(),
            ["Production"] = new AnthropicOptions(),
        },
    };
}
