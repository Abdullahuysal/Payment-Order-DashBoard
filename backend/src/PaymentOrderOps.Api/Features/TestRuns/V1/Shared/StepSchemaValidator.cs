using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>
/// Validates an authored step list: unique keys, the required fields of each <c>kind</c>, named
/// target prefixes (<c>companyApi:</c> / <c>soap:</c>), read-only <c>dbQuery</c> SQL, and that
/// <c>extract.from</c> points at an earlier step. An unknown kind cannot occur through the typed
/// model, so it is reported only when a raw parse produced <c>null</c>.
/// </summary>
public static class StepSchemaValidator
{
    private static readonly HashSet<string> HttpMethods =
        new(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], StringComparer.OrdinalIgnoreCase);

    public static IReadOnlyList<string> Validate(IReadOnlyList<ScenarioStep?> steps)
    {
        var errors = new List<string>();
        var seenKeys = new HashSet<string>(StringComparer.Ordinal);

        for (var i = 0; i < steps.Count; i++)
        {
            var step = steps[i];
            var at = $"step[{i}]";

            if (step is null)
            {
                errors.Add($"{at}: unknown or unparseable step kind.");
                continue;
            }

            at = $"step[{i}] '{step.Key}'";

            if (string.IsNullOrWhiteSpace(step.Key))
            {
                errors.Add($"{at}: key is required.");
            }
            else if (!seenKeys.Add(step.Key))
            {
                errors.Add($"{at}: duplicate key.");
            }

            if (string.IsNullOrWhiteSpace(step.Title))
            {
                errors.Add($"{at}: title is required.");
            }

            ValidateBody(step, seenKeys, at, errors);

            if (step.Expect is { } expect && !HasSelector(expect))
            {
                errors.Add($"{at}: expect has no path/jsonPath/xpath/column selector.");
            }

            foreach (var (variable, path) in step.Extract ?? new Dictionary<string, string>())
            {
                if (string.IsNullOrWhiteSpace(variable) || string.IsNullOrWhiteSpace(path))
                {
                    errors.Add($"{at}: extract entries need a non-empty variable and path.");
                }
            }
        }

        return errors;
    }

    private static void ValidateBody(ScenarioStep step, HashSet<string> earlierKeys, string at, List<string> errors)
    {
        switch (step)
        {
            case HttpRequestStep http:
                ValidateHttp(http.Request, at, "companyApi:", errors);
                break;
            case SoapRequestStep soap:
                if (!soap.Request.Endpoint.StartsWith("soap:", StringComparison.Ordinal))
                {
                    errors.Add($"{at}: soapRequest.request.endpoint must be 'soap:<name>'.");
                }

                if (string.IsNullOrWhiteSpace(soap.Request.Body))
                {
                    errors.Add($"{at}: soapRequest.request.body is required.");
                }

                break;
            case PollStep poll:
                var reads = new[] { poll.Read.Http is not null, poll.Read.Soap is not null }.Count(x => x);
                if (reads != 1)
                {
                    errors.Add($"{at}: poll.read must be exactly one of http / soap.");
                }

                if (poll.Read.Http is { } readHttp)
                {
                    ValidateHttp(readHttp, at, "companyApi:", errors);
                }

                if (poll.Read.Soap is { } readSoap && !readSoap.Endpoint.StartsWith("soap:", StringComparison.Ordinal))
                {
                    errors.Add($"{at}: poll.read.soap.endpoint must be 'soap:<name>'.");
                }

                if (!HasSelector(poll.Until))
                {
                    errors.Add($"{at}: poll.until has no selector.");
                }

                if (poll.IntervalMs <= 0 || poll.TimeoutMs <= 0)
                {
                    errors.Add($"{at}: poll.intervalMs and poll.timeoutMs must be positive.");
                }

                break;
            case DbQueryStep db:
                if (string.IsNullOrWhiteSpace(db.Query))
                {
                    errors.Add($"{at}: dbQuery.query is required.");
                }
                else if (!SqlReadGuard.IsReadOnly(db.Query, out var reason))
                {
                    errors.Add($"{at}: dbQuery.query is not read-only ({reason}).");
                }

                if (db.Expect is { } dbExpect && string.IsNullOrWhiteSpace(dbExpect.Column))
                {
                    errors.Add($"{at}: dbQuery.expect must use a column selector.");
                }

                break;
            case ExtractStep extract:
                if (string.IsNullOrWhiteSpace(extract.From))
                {
                    errors.Add($"{at}: extract.from is required.");
                }
                else if (!earlierKeys.Contains(extract.From))
                {
                    errors.Add($"{at}: extract.from '{extract.From}' does not match an earlier step key.");
                }

                if (extract.Map.Count == 0)
                {
                    errors.Add($"{at}: extract.map must have at least one entry.");
                }

                break;
            case AssertStep assertStep:
                if (assertStep.Expect is null || !HasSelector(assertStep.Expect))
                {
                    errors.Add($"{at}: assert.expect is required with a selector.");
                }

                break;
            case DelayStep delay:
                if (delay.Ms < 0)
                {
                    errors.Add($"{at}: delay.ms must not be negative.");
                }

                break;
        }
    }

    private static void ValidateHttp(HttpStepRequest request, string at, string prefix, List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(request.Method) || !HttpMethods.Contains(request.Method))
        {
            errors.Add($"{at}: request.method '{request.Method}' is not a known HTTP method.");
        }

        if (!request.Endpoint.StartsWith(prefix, StringComparison.Ordinal))
        {
            errors.Add($"{at}: request.endpoint must be '{prefix}<name>'.");
        }
    }

    private static bool HasSelector(Assertion assertion) =>
        !string.IsNullOrWhiteSpace(assertion.Path)
        || !string.IsNullOrWhiteSpace(assertion.JsonPath)
        || !string.IsNullOrWhiteSpace(assertion.Xpath)
        || !string.IsNullOrWhiteSpace(assertion.Column);
}
