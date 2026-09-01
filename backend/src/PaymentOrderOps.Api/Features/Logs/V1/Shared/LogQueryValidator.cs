namespace PaymentOrderOps.Api.Features.Logs.V1.Shared;

/// <summary>
/// Shared query-string validation for the log read endpoints: paging bounds and a sane time
/// window. Returns <c>null</c> when the input is valid, otherwise a <c>ProblemDetails</c>-ready
/// error dictionary.
/// </summary>
internal static class LogQueryValidator
{
    public const int MaxPageSize = 200;

    /// <summary>An unbounded exception scan is expensive; cap the window it may cover.</summary>
    public static readonly TimeSpan MaxWindow = TimeSpan.FromDays(31);

    public static Dictionary<string, string[]>? ValidateSearch(
        DateTimeOffset? from, DateTimeOffset? to, int? page, int? pageSize)
    {
        var errors = new Dictionary<string, string[]>();

        AddWindowErrors(errors, from, to);

        if (page is < 1)
        {
            errors["page"] = ["page must be 1 or greater."];
        }

        if (pageSize is < 1 or > MaxPageSize)
        {
            errors["pageSize"] = [$"pageSize must be between 1 and {MaxPageSize}."];
        }

        return errors.Count == 0 ? null : errors;
    }

    public static Dictionary<string, string[]>? ValidateWindow(DateTimeOffset? from, DateTimeOffset? to)
    {
        var errors = new Dictionary<string, string[]>();
        AddWindowErrors(errors, from, to);
        return errors.Count == 0 ? null : errors;
    }

    private static void AddWindowErrors(
        Dictionary<string, string[]> errors, DateTimeOffset? from, DateTimeOffset? to)
    {
        if (from is null || to is null)
        {
            return;
        }

        if (from > to)
        {
            errors["from"] = ["from must be earlier than or equal to to."];
        }
        else if (to - from > MaxWindow)
        {
            errors["to"] = [$"The time window must not exceed {MaxWindow.TotalDays:0} days."];
        }
    }
}
