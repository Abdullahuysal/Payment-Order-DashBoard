using Asp.Versioning.Builder;
using PaymentOrderOps.Api.Features.TestRuns.V1.CancelRun;
using PaymentOrderOps.Api.Features.TestRuns.V1.CreateProfile;
using PaymentOrderOps.Api.Features.TestRuns.V1.DeleteProfile;
using PaymentOrderOps.Api.Features.TestRuns.V1.GetRun;
using PaymentOrderOps.Api.Features.TestRuns.V1.GetScenario;
using PaymentOrderOps.Api.Features.TestRuns.V1.ListProfiles;
using PaymentOrderOps.Api.Features.TestRuns.V1.ListRuns;
using PaymentOrderOps.Api.Features.TestRuns.V1.ListScenarios;
using PaymentOrderOps.Api.Features.TestRuns.V1.RunEvents;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Api.Features.TestRuns.V1.StartRun;
using PaymentOrderOps.Api.Features.TestRuns.V1.UpdateProfile;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Api.Infrastructure.Endpoints;

namespace PaymentOrderOps.Api.Features.TestRuns.V1;

public sealed class TestRunsV1Module : IEndpointModule
{
    private const string RoutePrefix = "/api/v{version:apiVersion}/test-runs";

    public void MapEndpoints(IEndpointRouteBuilder app, ApiVersionSet versionSet)
    {
        var group = app.MapGroup(RoutePrefix)
            .WithApiVersionSet(versionSet)
            .MapToApiVersion(1)
            .WithTags("Test Runs")
            .WithDescription(
                "End-to-end test scenarios, environment-scoped profiles and asynchronous runs. Every request " +
                $"requires the `{EnvironmentContextEndpointFilter.HeaderName}` header (`dev` or `preprod`); " +
                "`production` answers `400`. A referenced company target with no configuration answers `503`; " +
                "a configured target that cannot be reached fails the run.")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status502BadGateway)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable)
            .AddEndpointFilter<EnvironmentContextEndpointFilter>()
            .AddEndpointFilter<TestRunEnvironmentGuardFilter>();

        ListScenariosEndpoint.Map(group);
        GetScenarioEndpoint.Map(group);
        ListProfilesEndpoint.Map(group);
        CreateProfileEndpoint.Map(group);
        UpdateProfileEndpoint.Map(group);
        DeleteProfileEndpoint.Map(group);
        StartRunEndpoint.Map(group);
        ListRunsEndpoint.Map(group);
        GetRunEndpoint.Map(group);
        CancelRunEndpoint.Map(group);

        var streamGroup = app.MapGroup(RoutePrefix)
            .WithApiVersionSet(versionSet)
            .MapToApiVersion(1)
            .WithTags("Test Runs");

        RunEventsEndpoint.Map(streamGroup);
    }
}
