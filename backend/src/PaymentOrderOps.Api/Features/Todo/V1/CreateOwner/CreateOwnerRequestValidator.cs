using FluentValidation;
using PaymentOrderOps.Api.Features.Todo.V1.Shared;
using PaymentOrderOps.Domain.Todo;

namespace PaymentOrderOps.Api.Features.Todo.V1.CreateOwner;

public sealed class CreateOwnerRequestValidator : AbstractValidator<CreateOwnerRequest>
{
    public CreateOwnerRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(TodoOwner.NameMaxLength);
    }
}
