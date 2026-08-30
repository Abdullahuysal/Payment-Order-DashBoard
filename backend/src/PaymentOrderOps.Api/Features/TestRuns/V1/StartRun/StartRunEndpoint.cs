using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;
using PaymentOrderOps.Infrastructure.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.StartRun;

internal static class StartRunEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPost(string.Empty, HandleAsync)
            .WithName("StartTestRun")
            .WithSummary("Queues a run (optionally a bulk repeat) and returns 202 with the run id.");

    private static async Task<Results<Accepted<StartRunResponse>, ValidationProblem, NotFound, ProblemHttpResult>> HandleAsync(
        StartRunRequest request,
        IValidator<StartRunRequest> validator,
        AppDbContext db,
        IEnvironmentContext environment,
        TestRunTargetResolver resolver,
        TestRunQueue queue,
        HttpContext http,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var scenario = await db.TestScenarios.AsNoTracking().FirstOrDefaultAsync(s => s.Id == request.ScenarioId, ct);
        if (scenario is null)
        {
            return TypedResults.NotFound();
        }

        if (request.ProfileId is { } profileId)
        {
            var profileExists = await db.ScenarioProfiles.AnyAsync(
                p => p.Id == profileId && p.ScenarioId == scenario.Id && p.Environment == environment.Environment, ct);
            if (!profileExists)
            {
                return TypedResults.NotFound();
            }
        }

        EnsureTargetFamiliesConfigured(scenario, resolver);

        var triggeredBy = http.Request.Headers.TryGetValue("X-User", out var user) && !string.IsNullOrWhiteSpace(user)
            ? user.ToString().Trim()
            : "anonymous";

        var run = new TestRun(
            Guid.CreateVersion7(),
            scenario.Id,
            scenario.Key,
            request.ProfileId,
            environment.Environment,
            triggeredBy,
            request.RunParams,
            parentRunId: null,
            repeatCount: request.Repeat?.Count,
            repeatConcurrency: request.Repeat?.Concurrency,
            TestRunFactory.PendingSteps(scenario));

        db.TestRuns.Add(run);
        await db.SaveChangesAsync(ct);
        await queue.EnqueueAsync(run.Id, ct);

        var location = $"{http.Request.Path.Value?.TrimEnd('/')}/{run.Id}";
        return TypedResults.Accepted(location, new StartRunResponse(run.Id));
    }

    private static void EnsureTargetFamiliesConfigured(TestScenario scenario, TestRunTargetResolver resolver)
    {
        foreach (var kind in TestRunFactory.RequiredKinds(scenario))
        {
            switch (kind)
            {
                case TestStepKind.HttpRequest when !resolver.HasCompanyApiFamily:
                    throw new TestRunTargetNotConfiguredException("companyApi", "*", resolver.EnvironmentName);
                case TestStepKind.SoapRequest when !resolver.HasSoapFamily:
                    throw new TestRunTargetNotConfiguredException("soap", "*", resolver.EnvironmentName);
                case TestStepKind.DbQuery when !resolver.HasCompanyDbFamily:
                    throw new TestRunTargetNotConfiguredException("companyDb", "*", resolver.EnvironmentName);
            }
        }
    }
}
