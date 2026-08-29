using FluentValidation;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Api.Features.ServiceHealth;

internal static class ServiceHealthValidation
{
    public const int MaxHeaders = 50;
    public const int MaxHeaderKeyLength = 256;
    public const int MaxHeaderValueLength = 8192;
    public const int MaxBodyLength = 16384;

    public static bool IsAbsoluteHttpUrl(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

    public static bool IsKnownMethod(string? method) =>
        ServiceHealthHttpMethodExtensions.TryParse(method, out _);

    public static IRuleBuilderOptions<T, IReadOnlyDictionary<string, string>?> ValidHeaders<T>(
        this IRuleBuilder<T, IReadOnlyDictionary<string, string>?> rule) =>
        rule.Must(headers =>
        {
            if (headers is null)
            {
                return true;
            }

            if (headers.Count > MaxHeaders)
            {
                return false;
            }

            foreach (var (key, value) in headers)
            {
                if (string.IsNullOrWhiteSpace(key) || key.Length > MaxHeaderKeyLength)
                {
                    return false;
                }

                if (value is { Length: > MaxHeaderValueLength })
                {
                    return false;
                }
            }

            return true;
        }).WithMessage($"Headers must contain at most {MaxHeaders} entries with non-empty keys.");
}

public sealed class CreateServiceHealthCheckRequestValidator : AbstractValidator<CreateServiceHealthCheckRequest>
{
    public CreateServiceHealthCheckRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(ServiceHealthCheck.NameMaxLength);
        RuleFor(x => x.Group).IsInEnum();
        RuleFor(x => x.Method).NotEmpty().Must(ServiceHealthValidation.IsKnownMethod)
            .WithMessage("Method must be one of GET, HEAD, POST, PUT, PATCH, DELETE.");
        RuleFor(x => x.Url).NotEmpty().MaximumLength(ServiceHealthCheck.UrlMaxLength)
            .Must(ServiceHealthValidation.IsAbsoluteHttpUrl)
            .WithMessage("Url must be an absolute http or https URL.");
        RuleFor(x => x.Headers).ValidHeaders();
        RuleFor(x => x.Body).MaximumLength(ServiceHealthValidation.MaxBodyLength);
        RuleFor(x => x.ExpectedStatus).InclusiveBetween(100, 599).When(x => x.ExpectedStatus.HasValue);
        RuleFor(x => x.Environment).IsInEnum().When(x => x.Environment.HasValue);
    }
}

public sealed class UpdateServiceHealthCheckRequestValidator : AbstractValidator<UpdateServiceHealthCheckRequest>
{
    public UpdateServiceHealthCheckRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(ServiceHealthCheck.NameMaxLength);
        RuleFor(x => x.Group).IsInEnum();
        RuleFor(x => x.Method).NotEmpty().Must(ServiceHealthValidation.IsKnownMethod)
            .WithMessage("Method must be one of GET, HEAD, POST, PUT, PATCH, DELETE.");
        RuleFor(x => x.Url).NotEmpty().MaximumLength(ServiceHealthCheck.UrlMaxLength)
            .Must(ServiceHealthValidation.IsAbsoluteHttpUrl)
            .WithMessage("Url must be an absolute http or https URL.");
        RuleFor(x => x.Headers).ValidHeaders();
        RuleFor(x => x.Body).MaximumLength(ServiceHealthValidation.MaxBodyLength);
        RuleFor(x => x.ExpectedStatus).InclusiveBetween(100, 599).When(x => x.ExpectedStatus.HasValue);
        RuleFor(x => x.RowVersion).Must(v => uint.TryParse(v, out _))
            .When(x => !string.IsNullOrWhiteSpace(x.RowVersion))
            .WithMessage("RowVersion must be a numeric token returned by a prior read.");
        RuleFor(x => x.Environment).IsInEnum().When(x => x.Environment.HasValue);
    }
}
