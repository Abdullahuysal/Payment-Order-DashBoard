using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

public sealed record PriorStepOutput(TestStepKind Kind, JsonNode? ResponseJson, string? Xml);

public sealed record StepRunContext
{
    public required string EnvironmentName { get; init; }

    public required IReadOnlyDictionary<string, JsonNode?> Variables { get; init; }

    public required IReadOnlyDictionary<string, PriorStepOutput> PriorOutputs { get; init; }

    public string? CorrelationId { get; init; }
}

public sealed record StepExecutionResult
{
    public required TestRunStepStatus Status { get; init; }

    public JsonNode? RequestJson { get; init; }

    public JsonNode? ResponseJson { get; init; }

    public string? Xml { get; init; }

    public int Attempts { get; init; } = 1;

    public string? Error { get; init; }

    public IReadOnlyDictionary<string, JsonNode?> Extracted { get; init; } =
        new Dictionary<string, JsonNode?>(StringComparer.Ordinal);

    public IReadOnlyList<string> ResolvedSecrets { get; init; } = [];
}

/// <summary>
/// Runs one step against the resolved company targets and reports its outcome (status,
/// unmasked request / response, extracted variables, resolved token values). Never touches the
/// database or the event bus — <see cref="ScenarioRunner"/> owns persistence and streaming.
/// </summary>
public sealed partial class StepExecutor(
    TestRunTargetResolver resolver,
    ICompanyApiGateway companyApi,
    ISoapServiceGateway soapService,
    ICompanyDbReader dbReader,
    ITokenBroker tokenBroker)
{
    private const int MaxPersistedRows = 20;
    private const int MaxDbRows = 200;

    [GeneratedRegex(@"\{\{\s*([A-Za-z_][A-Za-z0-9_.]*)\s*\}\}")]
    private static partial Regex SqlPlaceholder();

    public async Task<StepExecutionResult> ExecuteAsync(
        ScenarioStep step, StepRunContext context, CancellationToken ct) => step switch
    {
        HttpRequestStep http => await RunHttpAsync(http.Request, step, context, ct),
        SoapRequestStep soap => await RunSoapAsync(soap.Request, step, context, ct),
        PollStep poll => await RunPollAsync(poll, context, ct),
        DbQueryStep db => await RunDbAsync(db, step, context, ct),
        ExtractStep extract => RunExtract(extract, context),
        AssertStep assertStep => RunAssert(assertStep, context),
        DelayStep delay => await RunDelayAsync(delay, ct),
        _ => new StepExecutionResult { Status = TestRunStepStatus.Failed, Error = "Unknown step kind." },
    };

    private async Task<StepExecutionResult> RunHttpAsync(
        HttpStepRequest request, ScenarioStep step, StepRunContext context, CancellationToken ct)
    {
        var (reference, target) = resolver.RequireCompanyApi(request.Endpoint);
        var auth = await tokenBroker.ResolveAsync(context.EnvironmentName, target.AuthRef, context.CorrelationId, ct);

        var path = TemplateEngine.Render(request.Path ?? string.Empty, context.Variables);
        var query = TemplateEngine.Render(request.Query, context.Variables);
        var headers = TemplateEngine.Render(request.Headers, context.Variables);
        var body = TemplateEngine.Render(request.Body, context.Variables);

        var result = await companyApi.SendAsync(reference, target, new CompanyApiCall
        {
            Method = request.Method,
            Path = path,
            Query = query,
            Headers = headers,
            Body = body,
            Auth = auth,
            CorrelationId = context.CorrelationId,
        }, ct);

        var requestJson = new JsonObject
        {
            ["method"] = request.Method.ToUpperInvariant(),
            ["endpoint"] = $"companyApi:{reference}",
            ["path"] = path,
            ["query"] = ToJson(query),
            ["headers"] = ToJson(headers),
            ["body"] = body?.DeepClone(),
        };

        var responseBody = result.Json ?? (JsonNode?)JsonValue.Create(result.RawBody);
        var responseJson = new JsonObject
        {
            ["status"] = result.StatusCode,
            ["headers"] = ToJson(result.Headers),
            ["body"] = responseBody?.DeepClone(),
        };

        var assertion = EvaluateExpect(step.Expect, AssertionContext.ForJson(responseBody), result.StatusCode);
        var extracted = Extract(step.Extract, AssertionContext.ForJson(responseBody), out var extractError);

        return new StepExecutionResult
        {
            Status = Outcome(assertion, extractError),
            RequestJson = requestJson,
            ResponseJson = responseJson,
            Error = assertion.Passed ? extractError : assertion.Detail,
            Extracted = extracted,
            ResolvedSecrets = auth is null ? [] : [auth.Value],
        };
    }

    private async Task<StepExecutionResult> RunSoapAsync(
        SoapStepRequest request, ScenarioStep step, StepRunContext context, CancellationToken ct)
    {
        var (reference, target) = resolver.RequireSoap(request.Endpoint);
        var auth = await tokenBroker.ResolveAsync(context.EnvironmentName, target.AuthRef, context.CorrelationId, ct);

        var envelope = TemplateEngine.Render(request.Body, context.Variables);
        var soapAction = request.SoapAction is null
            ? null
            : TemplateEngine.Render(request.SoapAction, context.Variables);

        var result = await soapService.SendAsync(reference, target, new SoapCall
        {
            Body = envelope,
            SoapAction = soapAction,
            Auth = auth,
            CorrelationId = context.CorrelationId,
        }, ct);

        var requestJson = new JsonObject
        {
            ["endpoint"] = $"soap:{reference}",
            ["soapAction"] = soapAction,
            ["body"] = envelope,
        };

        var responseJson = new JsonObject
        {
            ["status"] = result.StatusCode,
            ["xml"] = result.Xml,
        };

        var assertion = EvaluateExpect(step.Expect, AssertionContext.ForXml(result.Xml), result.StatusCode);
        var extracted = Extract(step.Extract, AssertionContext.ForXml(result.Xml), out var extractError);

        return new StepExecutionResult
        {
            Status = Outcome(assertion, extractError),
            RequestJson = requestJson,
            ResponseJson = responseJson,
            Xml = result.Xml,
            Error = assertion.Passed ? extractError : assertion.Detail,
            Extracted = extracted,
            ResolvedSecrets = auth is null ? [] : [auth.Value],
        };
    }

    private async Task<StepExecutionResult> RunPollAsync(PollStep poll, StepRunContext context, CancellationToken ct)
    {
        var deadline = DateTime.UtcNow.AddMilliseconds(poll.TimeoutMs);
        var attempts = 0;
        JsonObject? lastRequest = null;
        JsonObject? lastResponse = null;
        AssertionContext lastContext = AssertionContext.ForJson(null);
        var secrets = new List<string>();

        while (true)
        {
            ct.ThrowIfCancellationRequested();
            attempts++;

            if (poll.Read.Http is { } http)
            {
                var (reference, target) = resolver.RequireCompanyApi(http.Endpoint);
                var auth = await tokenBroker.ResolveAsync(context.EnvironmentName, target.AuthRef, context.CorrelationId, ct);
                if (auth is not null)
                {
                    secrets.Add(auth.Value);
                }

                var path = TemplateEngine.Render(http.Path ?? string.Empty, context.Variables);
                var result = await companyApi.SendAsync(reference, target, new CompanyApiCall
                {
                    Method = http.Method,
                    Path = path,
                    Query = TemplateEngine.Render(http.Query, context.Variables),
                    Headers = TemplateEngine.Render(http.Headers, context.Variables),
                    Body = TemplateEngine.Render(http.Body, context.Variables),
                    Auth = auth,
                    CorrelationId = context.CorrelationId,
                }, ct);

                var body = result.Json ?? (JsonNode?)JsonValue.Create(result.RawBody);
                lastRequest = new JsonObject { ["method"] = http.Method.ToUpperInvariant(), ["endpoint"] = $"companyApi:{reference}", ["path"] = path };
                lastResponse = new JsonObject { ["status"] = result.StatusCode, ["body"] = body?.DeepClone() };
                lastContext = AssertionContext.ForJson(body);
            }
            else if (poll.Read.Soap is { } soap)
            {
                var (reference, target) = resolver.RequireSoap(soap.Endpoint);
                var auth = await tokenBroker.ResolveAsync(context.EnvironmentName, target.AuthRef, context.CorrelationId, ct);
                if (auth is not null)
                {
                    secrets.Add(auth.Value);
                }

                var result = await soapService.SendAsync(reference, target, new SoapCall
                {
                    Body = TemplateEngine.Render(soap.Body, context.Variables),
                    SoapAction = soap.SoapAction,
                    Auth = auth,
                    CorrelationId = context.CorrelationId,
                }, ct);

                lastRequest = new JsonObject { ["endpoint"] = $"soap:{reference}" };
                lastResponse = new JsonObject { ["status"] = result.StatusCode, ["xml"] = result.Xml };
                lastContext = AssertionContext.ForXml(result.Xml);
            }

            var check = AssertionEvaluator.Evaluate(poll.Until, lastContext);
            if (check.Passed)
            {
                var extracted = Extract(poll.Extract, lastContext, out var extractError);
                return new StepExecutionResult
                {
                    Status = extractError is null ? TestRunStepStatus.Passed : TestRunStepStatus.Failed,
                    RequestJson = lastRequest,
                    ResponseJson = lastResponse,
                    Attempts = attempts,
                    Error = extractError,
                    Extracted = extracted,
                    ResolvedSecrets = secrets,
                };
            }

            if (DateTime.UtcNow >= deadline)
            {
                return new StepExecutionResult
                {
                    Status = TestRunStepStatus.Failed,
                    RequestJson = lastRequest,
                    ResponseJson = lastResponse,
                    Attempts = attempts,
                    Error = $"poll condition not met within {poll.TimeoutMs}ms ({attempts} attempts)",
                    ResolvedSecrets = secrets,
                };
            }

            await Task.Delay(Math.Max(1, poll.IntervalMs), ct);
        }
    }

    private async Task<StepExecutionResult> RunDbAsync(
        DbQueryStep db, ScenarioStep step, StepRunContext context, CancellationToken ct)
    {
        var target = resolver.RequireCompanyDb();
        var (sql, parameters) = BindSql(db.Query, context.Variables);

        var result = await dbReader.QueryAsync("default", target, sql, parameters, MaxDbRows, ct);
        var firstRow = result.Rows.Count > 0 ? result.Rows[0] : null;

        var requestJson = new JsonObject
        {
            ["query"] = sql,
            ["parameters"] = new JsonArray([.. parameters.Select(p => JsonValue.Create(p?.ToString()))]),
        };

        var responseJson = new JsonObject
        {
            ["rowCount"] = result.Rows.Count,
            ["rows"] = new JsonArray([.. result.Rows.Take(MaxPersistedRows).Select(RowToJson)]),
        };

        var assertion = EvaluateExpect(step.Expect, AssertionContext.ForRow(firstRow), statusCode: null);
        var extracted = ExtractFromRow(step.Extract, firstRow, out var extractError);

        return new StepExecutionResult
        {
            Status = Outcome(assertion, extractError),
            RequestJson = requestJson,
            ResponseJson = responseJson,
            Error = assertion.Passed ? extractError : assertion.Detail,
            Extracted = extracted,
        };
    }

    private StepExecutionResult RunExtract(ExtractStep extract, StepRunContext context)
    {
        if (!context.PriorOutputs.TryGetValue(extract.From, out var source))
        {
            return new StepExecutionResult
            {
                Status = TestRunStepStatus.Failed,
                Error = $"extract.from '{extract.From}' has no recorded output.",
            };
        }

        var assertionContext = source.Kind == TestStepKind.SoapRequest
            ? AssertionContext.ForXml(source.Xml ?? string.Empty)
            : AssertionContext.ForJson(source.ResponseJson is JsonObject obj && obj.TryGetPropertyValue("body", out var body)
                ? body
                : source.ResponseJson);

        var extracted = Extract(extract.Map, assertionContext, out var error);

        return new StepExecutionResult
        {
            Status = error is null ? TestRunStepStatus.Passed : TestRunStepStatus.Failed,
            ResponseJson = new JsonObject { ["extracted"] = ToJson(extracted) },
            Error = error,
            Extracted = extracted,
        };
    }

    private static StepExecutionResult RunAssert(AssertStep assertStep, StepRunContext context)
    {
        var bag = new JsonObject();
        foreach (var (key, value) in context.Variables)
        {
            bag[key] = value?.DeepClone();
        }

        if (assertStep.Expect is null)
        {
            return new StepExecutionResult { Status = TestRunStepStatus.Failed, Error = "assert.expect is missing." };
        }

        var check = AssertionEvaluator.Evaluate(assertStep.Expect, AssertionContext.ForJson(bag));
        return new StepExecutionResult
        {
            Status = check.Passed ? TestRunStepStatus.Passed : TestRunStepStatus.Failed,
            ResponseJson = new JsonObject { ["assertion"] = check.Detail, ["variables"] = bag },
            Error = check.Passed ? null : check.Detail,
        };
    }

    private static async Task<StepExecutionResult> RunDelayAsync(DelayStep delay, CancellationToken ct)
    {
        var ms = Math.Max(0, delay.Ms);
        await Task.Delay(ms, ct);
        return new StepExecutionResult
        {
            Status = TestRunStepStatus.Passed,
            ResponseJson = new JsonObject { ["delayedMs"] = ms },
        };
    }

    private static AssertionResult EvaluateExpect(Assertion? expect, AssertionContext context, int? statusCode)
    {
        if (expect is not null)
        {
            return AssertionEvaluator.Evaluate(expect, context);
        }

        if (statusCode is >= 400)
        {
            return new AssertionResult(false, $"HTTP {statusCode}");
        }

        return new AssertionResult(true, "no expectation");
    }

    private static TestRunStepStatus Outcome(AssertionResult assertion, string? extractError) =>
        assertion.Passed && extractError is null ? TestRunStepStatus.Passed : TestRunStepStatus.Failed;

    private static IReadOnlyDictionary<string, JsonNode?> Extract(
        IReadOnlyDictionary<string, string>? map, AssertionContext context, out string? error)
    {
        error = null;
        var result = new Dictionary<string, JsonNode?>(StringComparer.Ordinal);
        if (map is null)
        {
            return result;
        }

        foreach (var (variable, path) in map)
        {
            JsonNode? value = context.Xml is not null
                ? (XmlPathReader.SelectValue(context.Xml, path) is { } text ? JsonValue.Create(text) : null)
                : JsonPathEvaluator.Evaluate(context.Json, path);

            if (value is null)
            {
                error = $"extract '{path}' → '{variable}' yielded no value.";
                return result;
            }

            result[variable] = value;
        }

        return result;
    }

    private static IReadOnlyDictionary<string, JsonNode?> ExtractFromRow(
        IReadOnlyDictionary<string, string>? map, IReadOnlyDictionary<string, object?>? row, out string? error)
    {
        error = null;
        var result = new Dictionary<string, JsonNode?>(StringComparer.Ordinal);
        if (map is null)
        {
            return result;
        }

        foreach (var (variable, column) in map)
        {
            if (row is null || !row.TryGetValue(column, out var value) || value is null or DBNull)
            {
                error = $"extract column '{column}' → '{variable}' yielded no value.";
                return result;
            }

            result[variable] = JsonValue.Create(Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture));
        }

        return result;
    }

    private (string Sql, IReadOnlyList<object?> Parameters) BindSql(
        string query, IReadOnlyDictionary<string, JsonNode?> variables)
    {
        var parameters = new List<object?>();
        var seen = new Dictionary<string, string>(StringComparer.Ordinal);

        var sql = SqlPlaceholder().Replace(query, match =>
        {
            var name = match.Groups[1].Value;
            if (seen.TryGetValue(name, out var existing))
            {
                return existing;
            }

            var value = ResolveVariable(name, variables)
                ?? throw new TemplateBindingException(name);
            var placeholder = $"@p{parameters.Count}";
            parameters.Add(JsonScalar(value));
            seen[name] = placeholder;
            return placeholder;
        });

        return (sql, parameters);
    }

    private static JsonNode? ResolveVariable(string path, IReadOnlyDictionary<string, JsonNode?> variables)
    {
        var segments = path.Split('.');
        if (!variables.TryGetValue(segments[0], out var current))
        {
            return null;
        }

        for (var i = 1; i < segments.Length && current is JsonObject obj; i++)
        {
            current = obj.TryGetPropertyValue(segments[i], out var next) ? next : null;
        }

        return current;
    }

    private static object? JsonScalar(JsonNode? node) => node switch
    {
        null => null,
        JsonValue value when value.TryGetValue<long>(out var l) => l,
        JsonValue value when value.TryGetValue<double>(out var d) => d,
        JsonValue value when value.TryGetValue<bool>(out var b) => b,
        JsonValue value => value.ToString(),
        _ => node.ToJsonString(),
    };

    private static JsonNode? ToJson(IReadOnlyDictionary<string, string>? map)
    {
        if (map is null)
        {
            return null;
        }

        var obj = new JsonObject();
        foreach (var (key, value) in map)
        {
            obj[key] = value;
        }

        return obj;
    }

    private static JsonNode? ToJson(IReadOnlyDictionary<string, JsonNode?> map)
    {
        var obj = new JsonObject();
        foreach (var (key, value) in map)
        {
            obj[key] = value?.DeepClone();
        }

        return obj;
    }

    private static JsonNode RowToJson(IReadOnlyDictionary<string, object?> row)
    {
        var obj = new JsonObject();
        foreach (var (key, value) in row)
        {
            obj[key] = value switch
            {
                null or DBNull => null,
                bool b => JsonValue.Create(b),
                int or long or short or byte => JsonValue.Create(Convert.ToInt64(value, System.Globalization.CultureInfo.InvariantCulture)),
                float or double or decimal => JsonValue.Create(Convert.ToDecimal(value, System.Globalization.CultureInfo.InvariantCulture)),
                _ => JsonValue.Create(Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture)),
            };
        }

        return obj;
    }
}
