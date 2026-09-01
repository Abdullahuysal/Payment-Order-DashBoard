using Microsoft.AspNetCore.Http.HttpResults;
using PaymentOrderOps.Api.Features.Logs.V1.Shared;
using PaymentOrderOps.Infrastructure.Logs;

namespace PaymentOrderOps.Api.Features.Logs.V1.GetLog;

internal static class GetLogEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("{id}", HandleAsync)
            .WithName("GetLog")
            .WithSummary("Gets a single log document by its Elasticsearch id in the current environment.");

    private static async Task<Results<Ok<LogEntryResponse>, NotFound>> HandleAsync(
        string id,
        LogSearchResolver resolver,
        ILogSearchGateway gateway,
        CancellationToken ct)
    {
        var options = resolver.RequireElasticsearch();
        var entry = await gateway.GetByIdAsync(options, id, ct);

        return entry is null ? TypedResults.NotFound() : TypedResults.Ok(entry.ToResponse());
    }
}
