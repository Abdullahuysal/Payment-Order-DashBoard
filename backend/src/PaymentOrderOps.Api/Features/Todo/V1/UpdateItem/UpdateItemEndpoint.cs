using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.Todo.V1.Shared;
using PaymentOrderOps.Domain.Todo;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Todo.V1.UpdateItem;

internal static class UpdateItemEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPut("items/{id:guid}", HandleAsync)
            .WithName("UpdateTodoItem")
            .WithSummary("Replaces a todo item. An unknown id or ownerId answers 404.");

    private static async Task<Results<Ok<TodoItemResponse>, ValidationProblem, NotFound, ProblemHttpResult>> HandleAsync(
        Guid id,
        UpdateItemRequest request,
        IValidator<UpdateItemRequest> validator,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var item = await db.TodoItems.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (item is null)
        {
            return TypedResults.NotFound();
        }

        var owner = await db.TodoOwners.AsNoTracking().FirstOrDefaultAsync(o => o.Id == request.OwnerId, ct);
        if (owner is null)
        {
            return TodoWriteRules.OwnerNotFoundProblem(request.OwnerId);
        }

        item.Update(
            request.Title!,
            request.Description,
            request.OwnerId,
            request.Status,
            request.Priority,
            request.DueDate);
        await db.SaveChangesAsync(ct);

        return TypedResults.Ok(item.ToResponse(owner.Name));
    }
}
