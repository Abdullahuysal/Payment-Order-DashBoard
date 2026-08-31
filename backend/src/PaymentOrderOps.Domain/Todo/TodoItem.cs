namespace PaymentOrderOps.Domain.Todo;

/// <summary>
/// A single todo entry owned by a <see cref="TodoOwner"/>. Concurrency is guarded by
/// <see cref="Xmin"/>.
/// </summary>
public sealed class TodoItem
{
    public const int TitleMaxLength = 200;
    public const int DescriptionMaxLength = 2000;

    private TodoItem()
    {
    }

    public TodoItem(
        Guid id,
        string title,
        string? description,
        Guid ownerId,
        TodoStatus status,
        TodoPriority priority,
        DateOnly? dueDate)
    {
        Id = id;
        OwnerId = ownerId;
        Apply(title, description, status, priority, dueDate);
    }

    public Guid Id { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    public Guid OwnerId { get; private set; }

    public TodoStatus Status { get; private set; }

    public TodoPriority Priority { get; private set; }

    public DateOnly? DueDate { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public uint Xmin { get; private set; }

    public void Update(
        string title,
        string? description,
        Guid ownerId,
        TodoStatus status,
        TodoPriority priority,
        DateOnly? dueDate)
    {
        OwnerId = ownerId;
        Apply(title, description, status, priority, dueDate);
    }

    private void Apply(string title, string? description, TodoStatus status, TodoPriority priority, DateOnly? dueDate)
    {
        Title = title.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        Status = status;
        Priority = priority;
        DueDate = dueDate;
    }
}
