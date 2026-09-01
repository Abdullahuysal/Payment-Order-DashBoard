using System.Security.Cryptography;
using System.Text;

namespace PaymentOrderOps.Api.Features.Logs.V1.Shared;

/// <summary>
/// Stable key for the <c>LogAiSummary</c> cache: <c>sha1</c> of the normalized filter tuple
/// (the time window is already part of the composite key). Order-independent, case-folded.
/// </summary>
internal static class LogFiltersHash
{
    public static string Compute(string? text, string? level, string? service, string? traceId)
    {
        var canonical = string.Join(
            '\n',
            $"text={text?.Trim().ToLowerInvariant()}",
            $"level={level?.Trim().ToLowerInvariant()}",
            $"service={service?.Trim().ToLowerInvariant()}",
            $"trace={traceId?.Trim().ToLowerInvariant()}");

        return Convert.ToHexStringLower(SHA1.HashData(Encoding.UTF8.GetBytes(canonical)));
    }
}
