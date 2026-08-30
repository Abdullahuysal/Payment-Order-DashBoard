using FluentValidation;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.UpdateProfile;

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(ScenarioProfile.NameMaxLength);
        RuleFor(x => x.Values).NotNull();
    }
}
