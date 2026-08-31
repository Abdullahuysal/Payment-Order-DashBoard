using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.Todo.V1.Shared;
using PaymentOrderOps.Domain.Todo;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Todo.V1.ListItems;

internal static class ListItemsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("items", HandleAsync)
            .WithName("ListTodoItems")
            .WithSummary("Lists todo items ordered by status then priority, optionally filtered by status and owner.");

    private static async Task<Results<Ok<IReadOnlyList<TodoItemResponse>>, ValidationProblem>> HandleAsync(
        AppDbContext db,
        CancellationToken ct,
        string? status = null,
        Guid? ownerId = null)
    {
        TodoStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!TryParseStatus(status, out var parsed))
            {
                return TypedResults.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["status"] = ["status must be one of todo, in-progress, done."],
                });
            }

            statusFilter = parsed;
        }

        var query = db.TodoItems.AsNoTracking();
        if (statusFilter is { } wanted)
        {
            query = query.Where(i => i.Status == wanted);
        }

        if (ownerId is { } oid)
        {
            query = query.Where(i => i.OwnerId == oid);
        }

        var items = await query.ToListAsync(ct);

        var ownerIds = items.Select(i => i.OwnerId).Distinct().ToArray();
        var owners = await db.TodoOwners.AsNoTracking()
            .Where(o => ownerIds.Contains(o.Id))
            .ToDictionaryAsync(o => o.Id, o => o.Name, ct);

        IReadOnlyList<TodoItemResponse> payload =
        [
            .. items
                .OrderBy(i => (int)i.Status)
                .ThenByDescending(i => (int)i.Priority)
                .ThenBy(i => i.CreatedAtUtc)
                .Select(i => i.ToResponse(owners.GetValueOrDefault(i.OwnerId, string.Empty))),
        ];

        return TypedResults.Ok(payload);
    }

    private static bool TryParseStatus(string value, out TodoStatus status)
    {
        switch (value.Trim().ToLowerInvariant())
        {
            case "todo":
                status = TodoStatus.Todo;
                return true;
            case "in-progress":
                status = TodoStatus.InProgress;
                return true;
            case "done":
                status = TodoStatus.Done;
                return true;
            default:
                status = default;
                return false;
        }
    }
}
