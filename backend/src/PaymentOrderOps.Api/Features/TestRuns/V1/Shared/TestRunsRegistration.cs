using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PaymentOrderOps.Infrastructure.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

public static class TestRunsRegistration
{
    /// <summary>
    /// Wires the Test Runs slice: company-target options + gateways (Infrastructure), the
    /// in-process queue / event bus / cancellation registry, and the scoped execution engine.
    /// Register <c>TestRunWorker</c> separately with <c>AddHostedService</c>.
    /// </summary>
    public static IServiceCollection AddTestRuns(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddTestRunTargets(configuration);

        services.AddSingleton<TestRunQueue>();
        services.AddSingleton<TestRunCancellationRegistry>();
        services.AddSingleton<ITestRunEventBus, InMemoryTestRunEventBus>();

        services.AddScoped<TestRunTargetResolver>();
        services.AddScoped<StepExecutor>();
        services.AddScoped<ScenarioRunner>();

        return services;
    }
}
