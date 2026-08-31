using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.Todo.V1.Shared;
using PaymentOrderOps.Domain.Todo;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Todo.V1.CreateItem;

internal static class CreateItemEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPost("items", HandleAsync)
            .WithName("CreateTodoItem")
            .WithSummary("Creates a todo item. An unknown ownerId answers 404.");

    private static async Task<Results<Created<TodoItemResponse>, ValidationProblem, ProblemHttpResult>> HandleAsync(
        CreateItemRequest request,
        IValidator<CreateItemRequest> validator,
        AppDbContext db,
        HttpContext http,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var owner = await db.TodoOwners.AsNoTracking().FirstOrDefaultAsync(o => o.Id == request.OwnerId, ct);
        if (owner is null)
        {
            return TodoWriteRules.OwnerNotFoundProblem(request.OwnerId);
        }

        var item = new TodoItem(
            Guid.CreateVersion7(),
            request.Title!,
            request.Description,
            request.OwnerId,
            request.Status,
            request.Priority,
            request.DueDate);
        db.TodoItems.Add(item);
        await db.SaveChangesAsync(ct);

        var location = $"{http.Request.Path.Value?.TrimEnd('/')}/{item.Id}";
        return TypedResults.Created(location, item.ToResponse(owner.Name));
    }
}
