using System.Globalization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.ListRuns;

internal static class ListRunsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet(string.Empty, HandleAsync)
            .WithName("ListTestRuns")
            .WithSummary("Lists runs in the current environment (bulk children excluded).");

    private static async Task<Results<Ok<IReadOnlyList<RunSummaryResponse>>, ValidationProblem>> HandleAsync(
        AppDbContext db,
        IEnvironmentContext environment,
        CancellationToken ct,
        Guid? scenarioId = null,
        string? status = null,
        string? from = null,
        string? to = null)
    {
        TestRunStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<TestRunStatus>(status, ignoreCase: true, out var parsed) || !Enum.IsDefined(parsed))
            {
                return TypedResults.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["status"] = ["status must be one of queued, running, passed, failed, cancelled."],
                });
            }

            statusFilter = parsed;
        }

        if (!TryParseDate(from, false, out var fromUtc) || !TryParseDate(to, true, out var toUtc))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["from"] = ["from / to must be ISO dates (yyyy-MM-dd)."],
            });
        }

        var query = db.TestRuns.AsNoTracking().Where(r => r.Environment == environment.Environment && r.ParentRunId == null);

        if (scenarioId is { } sid)
        {
            query = query.Where(r => r.ScenarioId == sid);
        }

        if (statusFilter is { } status2)
        {
            query = query.Where(r => r.Status == status2);
        }

        if (fromUtc is { } lower)
        {
            query = query.Where(r => r.CreatedAtUtc >= lower);
        }

        if (toUtc is { } upper)
        {
            query = query.Where(r => r.CreatedAtUtc <= upper);
        }

        var runs = await query.OrderByDescending(r => r.CreatedAtUtc).Take(500).ToListAsync(ct);

        var scenarioIds = runs.Select(r => r.ScenarioId).Distinct().ToArray();
        var profileIds = runs.Where(r => r.ProfileId != null).Select(r => r.ProfileId!.Value).Distinct().ToArray();

        var scenarios = await db.TestScenarios.AsNoTracking()
            .Where(s => scenarioIds.Contains(s.Id))
            .Select(s => new { s.Id, s.Name, s.Kind })
            .ToDictionaryAsync(s => s.Id, ct);

        var profiles = await db.ScenarioProfiles.AsNoTracking()
            .Where(p => profileIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Name })
            .ToDictionaryAsync(p => p.Id, p => p.Name, ct);

        IReadOnlyList<RunSummaryResponse> payload =
        [
            .. runs.Select(run =>
            {
                var scenario = scenarios.GetValueOrDefault(run.ScenarioId);
                var profileName = run.ProfileId is { } pid ? profiles.GetValueOrDefault(pid) : null;
                return run.ToSummary(scenario?.Name ?? run.ScenarioKey, scenario?.Kind ?? TestScenarioKind.Generic, profileName);
            }),
        ];

        return TypedResults.Ok(payload);
    }

    private static bool TryParseDate(string? value, bool endOfDay, out DateTime? result)
    {
        result = null;
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        if (DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed))
        {
            var utc = parsed.UtcDateTime;
            result = endOfDay && utc.TimeOfDay == TimeSpan.Zero ? utc.AddDays(1).AddTicks(-1) : utc;
            return true;
        }

        return false;
    }
}
