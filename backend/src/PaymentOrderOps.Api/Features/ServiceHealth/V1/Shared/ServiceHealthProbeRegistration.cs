namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;

/// <summary>Wires the outbound probe client used by the run slices.</summary>
public static class ServiceHealthProbeRegistration
{
    public static IServiceCollection AddServiceHealthProbe(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ServiceHealthProbeOptions>(
            configuration.GetSection(ServiceHealthProbeOptions.SectionName));

        services.AddHttpClient<ServiceHealthProbe>(client =>
            {
                // Infinite: ServiceHealthProbe owns the deadline via its own linked token.
                client.Timeout = Timeout.InfiniteTimeSpan;
                client.DefaultRequestHeaders.UserAgent.ParseAdd("PaymentOrderOps-HealthProbe/1.0");
            })
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                // A probe asserts on the first response, and redirects would leak the headers.
                AllowAutoRedirect = false,
            });

        return services;
    }
}
