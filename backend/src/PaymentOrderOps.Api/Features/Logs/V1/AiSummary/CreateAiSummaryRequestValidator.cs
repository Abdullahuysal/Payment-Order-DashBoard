using FluentValidation;
using PaymentOrderOps.Api.Features.Logs.V1.Shared;

namespace PaymentOrderOps.Api.Features.Logs.V1.AiSummary;

public sealed class CreateAiSummaryRequestValidator : AbstractValidator<CreateAiSummaryRequest>
{
    public CreateAiSummaryRequestValidator()
    {
        RuleFor(x => x.From).NotEqual(default(DateTimeOffset));
        RuleFor(x => x.To).NotEqual(default(DateTimeOffset));

        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .WithMessage("to must be later than or equal to from.");

        RuleFor(x => x)
            .Must(x => x.To - x.From <= LogQueryValidator.MaxWindow)
            .WithMessage($"The time window must not exceed {LogQueryValidator.MaxWindow.TotalDays:0} days.")
            .When(x => x.To >= x.From);
    }
}
