using FluentValidation;
using PaymentOrderOps.Api.Features.Todo.V1.Shared;
using PaymentOrderOps.Domain.Todo;

namespace PaymentOrderOps.Api.Features.Todo.V1.UpdateItem;

public sealed class UpdateItemRequestValidator : AbstractValidator<UpdateItemRequest>
{
    public UpdateItemRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(TodoItem.TitleMaxLength);
        RuleFor(x => x.Description).MaximumLength(TodoItem.DescriptionMaxLength);
        RuleFor(x => x.OwnerId).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Priority).IsInEnum();
    }
}
