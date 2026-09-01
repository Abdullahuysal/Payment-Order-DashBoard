using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Infrastructure.Ai;
using PaymentOrderOps.Infrastructure.Logs;
using PaymentOrderOps.Infrastructure.Messaging;
using PaymentOrderOps.Infrastructure.TestRuns;

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
            TestRunTargetNotConfiguredException => (StatusCodes.Status503ServiceUnavailable, "A required company target is not configured for this environment."),
            TestRunTargetUnreachableException => (StatusCodes.Status502BadGateway, "A company target could not be reached."),
            LogSearchNotConfiguredException => (StatusCodes.Status503ServiceUnavailable, "Log search is not configured for this environment."),
            LogSearchUnreachableException => (StatusCodes.Status502BadGateway, "Elasticsearch could not be reached."),
            AiNotConfiguredException => (StatusCodes.Status503ServiceUnavailable, "AI summarization is not configured for this environment."),
            AiUnreachableException => (StatusCodes.Status502BadGateway, "The AI provider could not be reached."),
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
            or TestRunTargetNotConfiguredException or TestRunTargetUnreachableException
            or LogSearchNotConfiguredException or LogSearchUnreachableException
            or AiNotConfiguredException or AiUnreachableException
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
