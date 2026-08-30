using Asp.Versioning;
using Asp.Versioning.Builder;

namespace PaymentOrderOps.Api.Infrastructure.Endpoints;

public static class EndpointModuleExtensions
{
    /// <summary>Every API version the service currently exposes. Add the next one here only.</summary>
    private static readonly ApiVersion[] SupportedVersions = [new ApiVersion(1, 0)];

    public static IServiceCollection AddApiVersioningStack(this IServiceCollection services)
    {
        services.AddApiVersioning(options =>
        {
            options.DefaultApiVersion = SupportedVersions[0];
            options.AssumeDefaultVersionWhenUnspecified = true;
            options.ReportApiVersions = true;
            options.ApiVersionReader = new UrlSegmentApiVersionReader();
        });

        return services;
    }

    public static ApiVersionSet BuildApiVersionSet(this IEndpointRouteBuilder app)
    {
        var builder = app.NewApiVersionSet();
        foreach (var version in SupportedVersions)
        {
            builder.HasApiVersion(version);
        }

        return builder.ReportApiVersions().Build();
    }

    /// <summary>
    /// Discovers every <see cref="IEndpointModule"/> in this assembly and lets each map its routes.
    /// </summary>
    public static IEndpointRouteBuilder MapFeatureModules(this IEndpointRouteBuilder app, ApiVersionSet versionSet)
    {
        var modules = typeof(EndpointModuleExtensions).Assembly.GetTypes()
            .Where(type => type is { IsClass: true, IsAbstract: false } && typeof(IEndpointModule).IsAssignableFrom(type))
            .OrderBy(type => type.FullName, StringComparer.Ordinal)
            .Select(type => (IEndpointModule)Activator.CreateInstance(type)!);

        foreach (var module in modules)
        {
            module.MapEndpoints(app, versionSet);
        }

        return app;
    }
}
