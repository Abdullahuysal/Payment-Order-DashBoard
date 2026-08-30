using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;

/// <summary>
/// Request-scoped: turns the repeatable <c>nameMatches</c> query values (and, when
/// <c>?scoped=true</c>, the current environment's persisted domain profile) into one
/// de-duplicated pattern list. Empty result means "apply no name filter".
/// </summary>
public sealed class QueueScopeResolver(AppDbContext db, IEnvironmentContext environment)
{
    public async Task<IReadOnlyList<string>> EffectivePatternsAsync(
        IEnumerable<string>? nameMatches, bool scoped, CancellationToken ct)
    {
        var patterns = new List<string>();

        if (nameMatches is not null)
        {
            patterns.AddRange(nameMatches.Select(p => p.Trim()).Where(p => p.Length > 0));
        }

        if (scoped)
        {
            var profile = await db.QueueScopeProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Environment == environment.Environment, ct);

            if (profile is not null)
            {
                patterns.AddRange(profile.Patterns.Select(p => p.Trim()).Where(p => p.Length > 0));
            }
        }

        return [.. patterns.Distinct(StringComparer.OrdinalIgnoreCase)];
    }
}
