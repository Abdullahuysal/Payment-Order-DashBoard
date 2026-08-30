using FluentValidation;

namespace PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;

/// <summary>Field rules shared by the create and replace request validators.</summary>
internal static class ServiceHealthCheckValidation
{
    public const int MaxHeaders = 50;
    public const int MaxHeaderKeyLength = 256;
    public const int MaxHeaderValueLength = 8192;
    public const int MaxBodyLength = 16384;

    public static bool IsAbsoluteHttpUrl(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

    public static bool IsKnownMethod(string? method) =>
        Domain.ServiceHealth.ServiceHealthHttpMethodExtensions.TryParse(method, out _);

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
