using System.Net.ServerSentEvents;
using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.Options;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.RunEvents;

/// <summary>
/// SSE stream for one run. Mapped outside the <c>X-Environment</c> group filter because
/// browsers cannot set headers on an <c>EventSource</c>; the environment comes from
/// <c>?env=</c> (falling back to the header). Sends a <c>snapshot</c> first, then one event per
/// step transition, then <c>run-finished</c> and closes.
/// </summary>
internal static class RunEventsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapGet("{runId:guid}/events", HandleAsync)
            .WithName("StreamTestRunEvents")
            .WithSummary("Server-Sent Events for a run: snapshot, step-started, step-finished, run-finished.");

    private static async Task<IResult> HandleAsync(
        Guid runId,
        HttpContext http,
        AppDbContext db,
        ITestRunEventBus events,
        IOptions<JsonOptions> jsonOptions,
        CancellationToken ct)
    {
        var raw = http.Request.Query["env"].ToString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            raw = http.Request.Headers[EnvHeaderName].ToString();
        }

        if (!Enum.TryParse<ServiceEnvironment>(raw.Trim(), ignoreCase: true, out var environment) || !Enum.IsDefined(environment))
        {
            return TypedResults.Problem(
                title: "Missing or invalid environment.",
                detail: "Pass ?env=dev|preprod (or the X-Environment header).",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var snapshot = await RunResponseBuilder.BuildAsync(db, runId, environment, ct);
        if (snapshot is null)
        {
            return TypedResults.NotFound();
        }

        var options = jsonOptions.Value.SerializerOptions;

        async IAsyncEnumerable<SseItem<string>> Stream([EnumeratorCancellation] CancellationToken token)
        {
            yield return Item("snapshot", snapshot, options);

            if (snapshot.Status is TestRunStatus.Passed or TestRunStatus.Failed or TestRunStatus.Cancelled)
            {
                yield return Item(
                    "run-finished",
                    new { status = snapshot.Status, at = snapshot.FinishedAt ?? snapshot.StartedAt, summary = snapshot.Summary },
                    options);
                yield break;
            }

            await foreach (var runEvent in events.Subscribe(runId, token))
            {
                yield return new SseItem<string>(JsonSerializer.Serialize(runEvent.Data, options), runEvent.EventName);
                if (runEvent is RunFinishedEvent)
                {
                    yield break;
                }
            }
        }

        return TypedResults.ServerSentEvents(Stream(ct));
    }

    private const string EnvHeaderName = "X-Environment";

    private static SseItem<string> Item(string eventName, object data, JsonSerializerOptions options) =>
        new(JsonSerializer.Serialize(data, options), eventName);
}
