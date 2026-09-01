using Asp.Versioning.Builder;
using PaymentOrderOps.Api.Features.Logs.V1.AiSummary;
using PaymentOrderOps.Api.Features.Logs.V1.Exceptions;
using PaymentOrderOps.Api.Features.Logs.V1.GetLog;
using PaymentOrderOps.Api.Features.Logs.V1.SavedQueries;
using PaymentOrderOps.Api.Features.Logs.V1.Search;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Api.Infrastructure.Endpoints;

namespace PaymentOrderOps.Api.Features.Logs.V1;

public sealed class LogsV1Module : IEndpointModule
{
    private const string RoutePrefix = "/api/v{version:apiVersion}/logs";

    public void MapEndpoints(IEndpointRouteBuilder app, ApiVersionSet versionSet)
    {
        var group = app.MapGroup(RoutePrefix)
            .WithApiVersionSet(versionSet)
            .MapToApiVersion(1)
            .WithTags("Logs & AI")
            .WithDescription(
                $"Elasticsearch-backed log search plus AI exception summaries. Every request requires the " +
                $"`{EnvironmentContextEndpointFilter.HeaderName}` header (`dev`, `preprod` or `production`); it selects the " +
                "Elasticsearch and Anthropic connection for that environment. A connection with no configuration answers " +
                "`503`; a configured connection that cannot be reached answers `502`.")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status502BadGateway)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable)
            .AddEndpointFilter<EnvironmentContextEndpointFilter>();

        SearchLogsEndpoint.Map(group);
        ListExceptionsEndpoint.Map(group);
        GetSavedQueriesEndpoint.Map(group);
        PutSavedQueriesEndpoint.Map(group);
        CreateAiSummaryEndpoint.Map(group);
        GetLogEndpoint.Map(group);
    }
}
