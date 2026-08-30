using FluentValidation;
using PaymentOrderOps.Domain.Messaging;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Scope;

public sealed class UpdateQueueScopeRequestValidator : AbstractValidator<UpdateQueueScopeRequest>
{
    public UpdateQueueScopeRequestValidator()
    {
        RuleFor(x => x.Patterns).NotNull();
        RuleFor(x => x.Patterns!)
            .Must(patterns => patterns.Count <= QueueScopeProfile.MaxPatterns)
            .WithMessage($"At most {QueueScopeProfile.MaxPatterns} patterns are allowed.")
            .When(x => x.Patterns is not null);
        RuleForEach(x => x.Patterns!)
            .Must(pattern => !string.IsNullOrWhiteSpace(pattern) && pattern.Trim().Length <= QueueScopeProfile.PatternMaxLength)
            .WithMessage($"Each pattern must be non-empty and at most {QueueScopeProfile.PatternMaxLength} characters.")
            .When(x => x.Patterns is not null);
    }
}
