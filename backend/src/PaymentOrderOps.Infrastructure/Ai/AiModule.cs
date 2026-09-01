using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace PaymentOrderOps.Infrastructure.Ai;

public static class AiModule
{
    /// <summary>
    /// Binds the per-environment <c>Ai</c> section and registers <see cref="AnthropicSummarizer"/>
    /// as the <see cref="IAiSummarizer"/>. Tests replace the <see cref="IAiSummarizer"/>
    /// registration with a fake so no live LLM call is made.
    /// </summary>
    public static IServiceCollection AddAiSummarizer(this IServiceCollection services, IConfiguration configuration)
    {
        var options = new AiSummaryOptions();
        foreach (var environmentSection in configuration.GetSection(AiSummaryOptions.SectionName).GetChildren())
        {
            options.Environments[environmentSection.Key] =
                environmentSection.Get<AnthropicOptions>() ?? new AnthropicOptions();
        }

        services.AddSingleton(options);
        services.TryAddSingleton<IAiSummarizer, AnthropicSummarizer>();
        return services;
    }
}
