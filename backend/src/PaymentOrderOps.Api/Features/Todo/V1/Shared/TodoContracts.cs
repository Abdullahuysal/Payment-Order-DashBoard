using PaymentOrderOps.Domain.Todo;

namespace PaymentOrderOps.Api.Features.Todo.V1.Shared;

public sealed record TodoOwnerResponse(Guid Id, string Name);

public sealed record TodoItemResponse(
    Guid Id,
    string Title,
    string? Description,
    Guid OwnerId,
    string OwnerName,
    TodoStatus Status,
    TodoPriority Priority,
    DateOnly? DueDate,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record CreateOwnerRequest(string? Name);

public sealed record CreateItemRequest(
    string? Title,
    string? Description,
    Guid OwnerId,
    TodoStatus Status,
    TodoPriority Priority,
    DateOnly? DueDate);

public sealed record UpdateItemRequest(
    string? Title,
    string? Description,
    Guid OwnerId,
    TodoStatus Status,
    TodoPriority Priority,
    DateOnly? DueDate);
