using System.Text.Json.Nodes;

namespace PaymentOrderOps.Infrastructure.TestRuns;

/// <summary>A resolved auth header to attach to an outbound call, or <c>null</c> for <c>none</c>.</summary>
public sealed record AuthHeaderValue(string Name, string Value);

public sealed record CompanyApiCall
{
    public required string Method { get; init; }

    public string? Path { get; init; }

    public IReadOnlyDictionary<string, string>? Query { get; init; }

    public IReadOnlyDictionary<string, string>? Headers { get; init; }

    public JsonNode? Body { get; init; }

    public AuthHeaderValue? Auth { get; init; }

    public string? CorrelationId { get; init; }
}

public sealed record CompanyApiResult(
    int StatusCode,
    JsonNode? Json,
    string RawBody,
    IReadOnlyDictionary<string, string> Headers);

public sealed record SoapCall
{
    public required string Body { get; init; }

    public string? SoapAction { get; init; }

    public AuthHeaderValue? Auth { get; init; }

    public string? CorrelationId { get; init; }
}

public sealed record SoapResult(int StatusCode, string Xml);

public sealed record DbQueryResult(IReadOnlyList<IReadOnlyDictionary<string, object?>> Rows);
