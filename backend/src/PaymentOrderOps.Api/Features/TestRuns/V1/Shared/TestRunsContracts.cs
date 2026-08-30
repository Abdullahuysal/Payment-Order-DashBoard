using System.Text.Json.Nodes;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

public sealed record InputOptionResponse(string Value, string Label);

public sealed record InputFieldResponse(
    string Name,
    string Label,
    InputFieldType Type,
    bool Required,
    IReadOnlyList<InputOptionResponse>? Options,
    string? Placeholder,
    string? Help,
    JsonNode? DefaultValue);

public sealed record StepViewResponse(string Key, string Title, TestStepKind Kind);

public sealed record BulkLimitsResponse(int MaxCount, int MaxConcurrency);

public sealed record ScenarioResponse(
    Guid Id,
    string Key,
    string Name,
    string Description,
    TestScenarioKind Kind,
    IReadOnlyList<InputFieldResponse> Inputs);

public sealed record ScenarioDetailResponse(
    Guid Id,
    string Key,
    string Name,
    string Description,
    TestScenarioKind Kind,
    IReadOnlyList<InputFieldResponse> Inputs,
    IReadOnlyList<StepViewResponse> Steps,
    BulkLimitsResponse? Bulk);

public sealed record ProfileResponse(
    Guid Id,
    Guid ScenarioId,
    string Name,
    ServiceEnvironment Environment,
    IReadOnlyDictionary<string, JsonNode?> Values,
    DateTime UpdatedAt,
    string RowVersion);

public sealed record RepeatConfigResponse(int Count, int Concurrency);

public sealed record DurationSpreadResponse(long Min, long Median, long Max);

public sealed record BulkSummaryResponse(
    int Total,
    int Passed,
    int Failed,
    DurationSpreadResponse DurationMs,
    IReadOnlyList<string> OrderNos);

public sealed record RunStepViewResponse(
    string Key,
    string Title,
    TestStepKind Kind,
    TestRunStepStatus Status,
    DateTime? StartedAt,
    DateTime? FinishedAt,
    long? DurationMs,
    int Attempts,
    JsonNode? Request,
    JsonNode? Response,
    string? Error);

public sealed record RunIterationResponse(
    int Index,
    TestRunStatus Status,
    Guid? RunId,
    long? DurationMs,
    string? OrderNo,
    string? Error);

public sealed record RunResponse(
    Guid Id,
    Guid ScenarioId,
    string ScenarioKey,
    string ScenarioName,
    TestScenarioKind Kind,
    Guid? ProfileId,
    string? ProfileName,
    ServiceEnvironment Environment,
    TestRunStatus Status,
    DateTime StartedAt,
    DateTime? FinishedAt,
    string? TriggeredBy,
    IReadOnlyDictionary<string, JsonNode?> RunParams,
    IReadOnlyDictionary<string, JsonNode?> Variables,
    IReadOnlyList<RunStepViewResponse> Steps,
    RepeatConfigResponse? Repeat,
    IReadOnlyList<RunIterationResponse>? Iterations,
    BulkSummaryResponse? Summary,
    string? Error);

public sealed record RunSummaryResponse(
    Guid Id,
    Guid ScenarioId,
    string ScenarioKey,
    string ScenarioName,
    TestScenarioKind Kind,
    Guid? ProfileId,
    string? ProfileName,
    ServiceEnvironment Environment,
    TestRunStatus Status,
    DateTime StartedAt,
    DateTime? FinishedAt,
    long? DurationMs,
    string? TriggeredBy,
    RepeatConfigResponse? Repeat);

public sealed record CreateProfileRequest(string? Name, IReadOnlyDictionary<string, JsonNode?>? Values);

public sealed record UpdateProfileRequest(
    string? Name,
    IReadOnlyDictionary<string, JsonNode?>? Values,
    string? RowVersion);

public sealed record StartRunRequest(
    Guid ScenarioId,
    Guid? ProfileId,
    IReadOnlyDictionary<string, JsonNode?>? RunParams,
    RepeatConfigResponse? Repeat);

public sealed record StartRunResponse(Guid RunId);
