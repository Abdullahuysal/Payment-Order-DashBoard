using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

internal static class RunResponseBuilder
{
    public static async Task<RunResponse?> BuildAsync(
        AppDbContext db, Guid runId, ServiceEnvironment environment, CancellationToken ct)
    {
        var run = await db.TestRuns
            .Include(r => r.Steps)
            .FirstOrDefaultAsync(r => r.Id == runId && r.Environment == environment, ct);

        return run is null ? null : await BuildAsync(db, run, ct);
    }

    public static async Task<RunResponse> BuildAsync(AppDbContext db, TestRun run, CancellationToken ct)
    {
        var scenario = await db.TestScenarios.AsNoTracking()
            .Where(s => s.Id == run.ScenarioId)
            .Select(s => new { s.Name, s.Kind })
            .FirstOrDefaultAsync(ct);

        var profileName = run.ProfileId is { } profileId
            ? await db.ScenarioProfiles.AsNoTracking()
                .Where(p => p.Id == profileId)
                .Select(p => p.Name)
                .FirstOrDefaultAsync(ct)
            : null;

        IReadOnlyList<RunIterationResponse>? iterations = null;
        if (run.IsBulkParent)
        {
            var children = await db.TestRuns.AsNoTracking()
                .Where(r => r.ParentRunId == run.Id)
                .OrderBy(r => r.CreatedAtUtc)
                .ToListAsync(ct);

            iterations = [.. children.Select((child, index) => child.ToIteration(index + 1))];
        }

        return run.ToResponse(scenario?.Name ?? run.ScenarioKey, scenario?.Kind ?? TestScenarioKind.Generic, profileName, iterations);
    }
}
