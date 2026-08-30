using FluentValidation;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.CreateCheck;

public sealed class CreateServiceHealthCheckRequestValidator : AbstractValidator<CreateServiceHealthCheckRequest>
{
    public CreateServiceHealthCheckRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(ServiceHealthCheck.NameMaxLength);
        RuleFor(x => x.Group).IsInEnum();
        RuleFor(x => x.Method).NotEmpty().Must(ServiceHealthCheckValidation.IsKnownMethod)
            .WithMessage("Method must be one of GET, HEAD, POST, PUT, PATCH, DELETE.");
        RuleFor(x => x.Url).NotEmpty().MaximumLength(ServiceHealthCheck.UrlMaxLength)
            .Must(ServiceHealthCheckValidation.IsAbsoluteHttpUrl)
            .WithMessage("Url must be an absolute http or https URL.");
        RuleFor(x => x.Headers).ValidHeaders();
        RuleFor(x => x.Body).MaximumLength(ServiceHealthCheckValidation.MaxBodyLength);
        RuleFor(x => x.ExpectedStatus).InclusiveBetween(100, 599).When(x => x.ExpectedStatus.HasValue);
        RuleFor(x => x.Environment).IsInEnum().When(x => x.Environment.HasValue);
    }
}
