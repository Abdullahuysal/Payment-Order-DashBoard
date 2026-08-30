using Asp.Versioning.Builder;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.CreateCheck;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.DeleteCheck;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.GetCheck;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.ListChecks;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.ReplaceCheck;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Api.Infrastructure.Endpoints;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1;

public sealed class ServiceHealthV1Module : IEndpointModule
{
    private const string RoutePrefix = "/api/v{version:apiVersion}/service-health/checks";

    public void MapEndpoints(IEndpointRouteBuilder app, ApiVersionSet versionSet)
    {
        var group = app.MapGroup(RoutePrefix)
            .WithApiVersionSet(versionSet)
            .MapToApiVersion(1)
            .WithTags("Service Health")
            .WithDescription(
                $"Every request requires the `{EnvironmentContextEndpointFilter.HeaderName}` header " +
                "(`dev`, `preprod` or `production`); it scopes all reads and writes to that environment.")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .AddEndpointFilter<EnvironmentContextEndpointFilter>();

        ListChecksEndpoint.Map(group);
        GetCheckEndpoint.Map(group);
        CreateCheckEndpoint.Map(group);
        ReplaceCheckEndpoint.Map(group);
        DeleteCheckEndpoint.Map(group);
    }
}
