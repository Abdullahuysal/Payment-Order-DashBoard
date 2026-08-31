using PaymentOrderOps.Domain.Todo;

namespace PaymentOrderOps.Api.Features.Todo.V1.Shared;

internal static class TodoMapping
{
    public static TodoOwnerResponse ToResponse(this TodoOwner owner) => new(owner.Id, owner.Name);

    public static TodoItemResponse ToResponse(this TodoItem item, string ownerName) => new(
        item.Id,
        item.Title,
        item.Description,
        item.OwnerId,
        ownerName,
        item.Status,
        item.Priority,
        item.DueDate,
        item.CreatedAtUtc,
        item.UpdatedAtUtc);
}
