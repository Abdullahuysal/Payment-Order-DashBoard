using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.Logs.V1.Shared;
using PaymentOrderOps.Infrastructure.Logs;

namespace PaymentOrderOps.Api.Features.Logs.V1.Search;

internal static class SearchLogsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("/", HandleAsync)
            .WithName("SearchLogs")
            .WithSummary("Searches logs for the current environment with paging and level/service facets.");

    private static async Task<Results<Ok<LogSearchResponse>, ValidationProblem>> HandleAsync(
        LogSearchResolver resolver,
        ILogSearchGateway gateway,
        string? q,
        string? level,
        string? service,
        string? traceId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        int? page,
        int? pageSize,
        CancellationToken ct)
    {
        var errors = LogQueryValidator.ValidateSearch(from, to, page, pageSize);
        if (errors is not null)
        {
            return TypedResults.ValidationProblem(errors);
        }

        var options = resolver.RequireElasticsearch();
        var currentPage = Math.Max(1, page ?? 1);
        var size = Math.Clamp(pageSize ?? 50, 1, LogQueryValidator.MaxPageSize);

        var query = new LogSearchQuery(q, level, service, traceId, from, to, currentPage, size);
        var result = await gateway.SearchAsync(options, query, ct);

        return TypedResults.Ok(result.ToResponse(currentPage, size));
    }
}
