using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Todo.V1.DeleteItem;

internal static class DeleteItemEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapDelete("items/{id:guid}", HandleAsync)
            .WithName("DeleteTodoItem")
            .WithSummary("Deletes a todo item. An unknown id answers 404.");

    private static async Task<Results<NoContent, NotFound>> HandleAsync(Guid id, AppDbContext db, CancellationToken ct)
    {
        var item = await db.TodoItems.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (item is null)
        {
            return TypedResults.NotFound();
        }

        db.TodoItems.Remove(item);
        await db.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }
}
