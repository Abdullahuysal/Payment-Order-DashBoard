using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

internal static class ScenarioLookup
{
    public static Task<TestScenario?> FindAsync(AppDbContext db, string idOrKey, CancellationToken ct)
    {
        var query = db.TestScenarios.AsNoTracking();
        return Guid.TryParse(idOrKey, out var id)
            ? query.FirstOrDefaultAsync(s => s.Id == id, ct)
            : query.FirstOrDefaultAsync(s => s.Key == idOrKey, ct);
    }

    public static Task<Guid> FindIdAsync(AppDbContext db, string idOrKey, CancellationToken ct)
    {
        var query = db.TestScenarios.AsNoTracking();
        return Guid.TryParse(idOrKey, out var id)
            ? query.Where(s => s.Id == id).Select(s => s.Id).FirstOrDefaultAsync(ct)
            : query.Where(s => s.Key == idOrKey).Select(s => s.Id).FirstOrDefaultAsync(ct);
    }
}
