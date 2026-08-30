using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Infrastructure.Messaging;

namespace PaymentOrderOps.Api.Infrastructure;

public sealed class GlobalExceptionHandler(IProblemDetailsService problemDetailsService, ILogger<GlobalExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (statusCode, title) = exception switch
        {
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "The resource was modified by another request."),
            MessageBrokerNotConfiguredException => (StatusCodes.Status503ServiceUnavailable, "The broker is not configured for this environment."),
            MessageBrokerUnreachableException => (StatusCodes.Status502BadGateway, "The broker could not be reached."),
            BadHttpRequestException bad => (bad.StatusCode, "Malformed request."),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred."),
        };

        if (statusCode >= StatusCodes.Status500InternalServerError && statusCode != StatusCodes.Status502BadGateway)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
        }
        else
        {
            logger.LogWarning(exception, "Request failed with {StatusCode} for {Method} {Path}", statusCode, httpContext.Request.Method, httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = statusCode;

        var detail = exception is MessageBrokerNotConfiguredException or MessageBrokerUnreachableException
            ? exception.Message
            : null;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails =
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
            },
        });
    }
}
