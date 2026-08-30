using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.CancelRun;

internal static class CancelRunEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPost("{runId:guid}/cancel", HandleAsync)
            .WithName("CancelTestRun")
            .WithSummary("Requests cancellation of a running or queued run. 409 if it is already terminal.");

    private static async Task<Results<Accepted, Conflict<string>, NotFound>> HandleAsync(
        Guid runId,
        AppDbContext db,
        IEnvironmentContext environment,
        TestRunCancellationRegistry registry,
        ITestRunEventBus events,
        TimeProvider clock,
        CancellationToken ct)
    {
        var run = await db.TestRuns
            .Include(r => r.Steps)
            .FirstOrDefaultAsync(r => r.Id == runId && r.Environment == environment.Environment, ct);
        if (run is null)
        {
            return TypedResults.NotFound();
        }

        if (run.IsTerminal)
        {
            return TypedResults.Conflict($"Run is already {run.Status.ToString().ToLowerInvariant()}.");
        }

        if (registry.RequestCancel(runId))
        {
            return TypedResults.Accepted((string?)null);
        }

        foreach (var step in run.Steps.Where(s => s.Status is TestRunStepStatus.Pending or TestRunStepStatus.Running))
        {
            step.Skip();
        }

        run.Complete(TestRunStatus.Cancelled, "cancelled", clock.GetUtcNow().UtcDateTime);
        await db.SaveChangesAsync(ct);

        await events.PublishAsync(runId, new RunFinishedEvent(TestRunStatus.Cancelled, run.FinishedAtUtc!.Value, null));
        events.Complete(runId);

        return TypedResults.Accepted((string?)null);
    }
}
