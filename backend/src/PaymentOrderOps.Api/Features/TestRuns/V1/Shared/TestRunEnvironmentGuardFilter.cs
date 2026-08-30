using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Infrastructure.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>
/// Runs after <c>EnvironmentContextEndpointFilter</c>: test runs are disabled in
/// <c>production</c> and in any environment not in <c>TestRuns:AllowedEnvironments</c>.
/// </summary>
public sealed class TestRunEnvironmentGuardFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var services = context.HttpContext.RequestServices;
        var environment = services.GetRequiredService<IEnvironmentContext>().Environment;
        var allowed = services.GetRequiredService<TestRunsOptions>().AllowedEnvironments;

        var isAllowed = environment != ServiceEnvironment.Production
            && allowed.Any(name => string.Equals(name, environment.ToString(), StringComparison.OrdinalIgnoreCase));

        if (!isAllowed)
        {
            return TypedResults.Problem(
                title: "Test koşumları production ortamında devre dışıdır.",
                detail: $"Allowed environments: {string.Join(", ", allowed)}.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        return await next(context);
    }
}
