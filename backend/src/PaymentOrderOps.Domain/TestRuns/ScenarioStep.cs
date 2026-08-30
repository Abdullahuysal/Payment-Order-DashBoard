using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace PaymentOrderOps.Domain.TestRuns;

/// <summary>
/// One ordered step in a scenario. Serialized to <c>jsonb</c> as a closed polymorphic set
/// discriminated by <c>kind</c>. Common members: <see cref="Extract"/> pushes values into the
/// run's variable bag; <see cref="Expect"/> is an inline assertion the step must satisfy.
/// </summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind",
    UnknownDerivedTypeHandling = JsonUnknownDerivedTypeHandling.FailSerialization)]
[JsonDerivedType(typeof(HttpRequestStep), "httpRequest")]
[JsonDerivedType(typeof(SoapRequestStep), "soapRequest")]
[JsonDerivedType(typeof(PollStep), "poll")]
[JsonDerivedType(typeof(DbQueryStep), "dbQuery")]
[JsonDerivedType(typeof(ExtractStep), "extract")]
[JsonDerivedType(typeof(AssertStep), "assert")]
[JsonDerivedType(typeof(DelayStep), "delay")]
public abstract record ScenarioStep
{
    public required string Key { get; init; }

    public required string Title { get; init; }

    public IReadOnlyDictionary<string, string>? Extract { get; init; }

    public Assertion? Expect { get; init; }

    [JsonIgnore]
    public abstract TestStepKind Kind { get; }
}

public sealed record HttpRequestStep : ScenarioStep
{
    public required HttpStepRequest Request { get; init; }

    [JsonIgnore]
    public override TestStepKind Kind => TestStepKind.HttpRequest;
}

public sealed record SoapRequestStep : ScenarioStep
{
    public required SoapStepRequest Request { get; init; }

    [JsonIgnore]
    public override TestStepKind Kind => TestStepKind.SoapRequest;
}

public sealed record PollStep : ScenarioStep
{
    public required PollRead Read { get; init; }

    public required Assertion Until { get; init; }

    public int IntervalMs { get; init; } = 2000;

    public int TimeoutMs { get; init; } = 30000;

    [JsonIgnore]
    public override TestStepKind Kind => TestStepKind.Poll;
}

public sealed record DbQueryStep : ScenarioStep
{
    public required string Query { get; init; }

    [JsonIgnore]
    public override TestStepKind Kind => TestStepKind.DbQuery;
}

public sealed record ExtractStep : ScenarioStep
{
    public required string From { get; init; }

    public required IReadOnlyDictionary<string, string> Map { get; init; }

    [JsonIgnore]
    public override TestStepKind Kind => TestStepKind.Extract;
}

public sealed record AssertStep : ScenarioStep
{
    [JsonIgnore]
    public override TestStepKind Kind => TestStepKind.Assert;
}

public sealed record DelayStep : ScenarioStep
{
    public int Ms { get; init; }

    [JsonIgnore]
    public override TestStepKind Kind => TestStepKind.Delay;
}

public sealed record HttpStepRequest
{
    public required string Method { get; init; }

    /// <summary>Named target reference, always <c>companyApi:&lt;name&gt;</c>. Never a raw URL.</summary>
    public required string Endpoint { get; init; }

    public string? Path { get; init; }

    public IReadOnlyDictionary<string, string>? Query { get; init; }

    public IReadOnlyDictionary<string, string>? Headers { get; init; }

    public JsonNode? Body { get; init; }
}

public sealed record SoapStepRequest
{
    /// <summary>Named target reference, always <c>soap:&lt;name&gt;</c>. Never a raw URL.</summary>
    public required string Endpoint { get; init; }

    public string? SoapAction { get; init; }

    /// <summary>The full SOAP envelope as an XML string; supports <c>{{var}}</c> templating.</summary>
    public required string Body { get; init; }
}

public sealed record PollRead
{
    public HttpStepRequest? Http { get; init; }

    public SoapStepRequest? Soap { get; init; }
}
