namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Scope;

public sealed record QueueScopeResponse(IReadOnlyList<string> Patterns, DateTime? UpdatedAt);

public sealed record UpdateQueueScopeRequest(IReadOnlyList<string>? Patterns);
