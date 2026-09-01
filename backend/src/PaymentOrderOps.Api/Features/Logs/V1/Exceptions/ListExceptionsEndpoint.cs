using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.Logs.V1.Shared;
using PaymentOrderOps.Infrastructure.Logs;

namespace PaymentOrderOps.Api.Features.Logs.V1.Exceptions;

internal static class ListExceptionsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("exceptions", HandleAsync)
            .WithName("ListLogExceptionGroups")
            .WithSummary("Lists exception groups (sha1 fingerprint of type + normalized message + top frame) for a time window.");

    private static async Task<Results<Ok<IReadOnlyList<ExceptionGroupResponse>>, ValidationProblem>> HandleAsync(
        LogSearchResolver resolver,
        ILogSearchGateway gateway,
        DateTimeOffset? from,
        DateTimeOffset? to,
        string? service,
        CancellationToken ct)
    {
        var errors = LogQueryValidator.ValidateWindow(from, to);
        if (errors is not null)
        {
            return TypedResults.ValidationProblem(errors);
        }

        var options = resolver.RequireElasticsearch();
        var windowEnd = to ?? DateTimeOffset.UtcNow;
        var windowStart = from ?? windowEnd - TimeSpan.FromHours(24);

        var groups = await gateway.ListExceptionsAsync(options, windowStart, windowEnd, service, ct);

        IReadOnlyList<ExceptionGroupResponse> response = [.. groups.Select(g => g.ToResponse())];
        return TypedResults.Ok(response);
    }
}
