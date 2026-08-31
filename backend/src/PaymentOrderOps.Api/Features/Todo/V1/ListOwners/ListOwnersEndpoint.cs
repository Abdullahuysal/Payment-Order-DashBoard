using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.Todo.V1.Shared;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Todo.V1.ListOwners;

internal static class ListOwnersEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("owners", HandleAsync)
            .WithName("ListTodoOwners")
            .WithSummary("Lists every todo owner ordered by name.");

    private static async Task<Ok<IReadOnlyList<TodoOwnerResponse>>> HandleAsync(AppDbContext db, CancellationToken ct)
    {
        var owners = await db.TodoOwners.AsNoTracking()
            .OrderBy(o => o.NormalizedName)
            .ToListAsync(ct);

        IReadOnlyList<TodoOwnerResponse> payload = [.. owners.Select(o => o.ToResponse())];
        return TypedResults.Ok(payload);
    }
}
