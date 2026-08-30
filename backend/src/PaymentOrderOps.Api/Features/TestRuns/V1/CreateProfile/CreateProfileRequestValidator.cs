using FluentValidation;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.CreateProfile;

public sealed class CreateProfileRequestValidator : AbstractValidator<CreateProfileRequest>
{
    public CreateProfileRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(ScenarioProfile.NameMaxLength);
        RuleFor(x => x.Values).NotNull();
    }
}
