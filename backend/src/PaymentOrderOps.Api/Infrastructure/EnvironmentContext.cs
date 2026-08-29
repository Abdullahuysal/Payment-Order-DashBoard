using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Api.Infrastructure;

public interface IEnvironmentContext
{
    ServiceEnvironment Environment { get; }
}

internal sealed class EnvironmentContextHolder : IEnvironmentContext
{
    private ServiceEnvironment? _environment;

    public ServiceEnvironment Environment => _environment
        ?? throw new InvalidOperationException("Environment context has not been resolved for this request.");

    public void Set(ServiceEnvironment environment) => _environment = environment;
}

public sealed class EnvironmentContextEndpointFilter : IEndpointFilter
{
    public const string HeaderName = "X-Environment";

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var raw = context.HttpContext.Request.Headers[HeaderName].ToString().Trim();

        if (string.IsNullOrEmpty(raw)
            || !Enum.TryParse<ServiceEnvironment>(raw, ignoreCase: true, out var environment)
            || !Enum.IsDefined(environment))
        {
            return TypedResults.Problem(
                title: $"Missing or invalid {HeaderName} header.",
                detail: $"Send the {HeaderName} header with one of: dev, preprod, production.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        context.HttpContext.RequestServices.GetRequiredService<EnvironmentContextHolder>().Set(environment);
        return await next(context);
    }
}
