using System.Collections.Concurrent;
using System.Threading.Channels;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>One Server-Sent Event: <see cref="EventName"/> is the SSE <c>event:</c> line,
/// <see cref="Data"/> is serialized to the <c>data:</c> line.</summary>
public abstract record RunEvent
{
    public abstract string EventName { get; }

    public abstract object Data { get; }
}

public sealed record SnapshotEvent(RunResponse Run) : RunEvent
{
    public override string EventName => "snapshot";

    public override object Data => Run;
}

public sealed record StepStartedEvent(string StepKey, DateTime At) : RunEvent
{
    public override string EventName => "step-started";

    public override object Data => new { stepKey = StepKey, at = At };
}

public sealed record StepFinishedEvent(
    string StepKey, TestRunStepStatus Status, DateTime At, long DurationMs, int Attempts, string? Error) : RunEvent
{
    public override string EventName => "step-finished";

    public override object Data => new
    {
        stepKey = StepKey,
        status = Status,
        at = At,
        durationMs = DurationMs,
        attempts = Attempts,
        error = Error,
    };
}

public sealed record RunFinishedEvent(TestRunStatus Status, DateTime At, BulkSummaryResponse? Summary) : RunEvent
{
    public override string EventName => "run-finished";

    public override object Data => new { status = Status, at = At, summary = Summary };
}

public interface ITestRunEventBus
{
    ValueTask PublishAsync(Guid runId, RunEvent runEvent);

    IAsyncEnumerable<RunEvent> Subscribe(Guid runId, CancellationToken ct);

    void Complete(Guid runId);
}

/// <summary>
/// In-memory, single-instance event fan-out. Each run keeps a bounded replay buffer so a
/// subscriber that connects mid-run (the frontend's <c>EventSource</c>) still receives every
/// event published before it attached — publish and subscribe both take the run's lock, so no
/// event is lost or duplicated. The buffer is dropped once the run completes and the last
/// subscriber leaves.
/// </summary>
public sealed class InMemoryTestRunEventBus : ITestRunEventBus
{
    private const int ReplayBufferSize = 512;

    private readonly ConcurrentDictionary<Guid, Subscribers> _byRun = new();

    public async ValueTask PublishAsync(Guid runId, RunEvent runEvent)
    {
        var subscribers = _byRun.GetOrAdd(runId, _ => new Subscribers());
        foreach (var channel in subscribers.Record(runEvent))
        {
            await channel.Writer.WriteAsync(runEvent);
        }
    }

    public async IAsyncEnumerable<RunEvent> Subscribe(
        Guid runId, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct)
    {
        var channel = Channel.CreateBounded<RunEvent>(new BoundedChannelOptions(ReplayBufferSize + 64)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
        });

        var subscribers = _byRun.GetOrAdd(runId, _ => new Subscribers());
        subscribers.Attach(channel, out var completed);
        if (completed)
        {
            channel.Writer.TryComplete();
        }

        try
        {
            await foreach (var runEvent in channel.Reader.ReadAllAsync(ct))
            {
                yield return runEvent;
            }
        }
        finally
        {
            if (subscribers.Detach(channel))
            {
                _byRun.TryRemove(runId, out _);
            }
        }
    }

    public void Complete(Guid runId)
    {
        if (_byRun.TryGetValue(runId, out var subscribers) && subscribers.Complete())
        {
            _byRun.TryRemove(runId, out _);
        }
    }

    private sealed class Subscribers
    {
        private readonly List<Channel<RunEvent>> _channels = [];
        private readonly Queue<RunEvent> _history = new();
        private readonly Lock _gate = new();
        private bool _completed;

        public IReadOnlyList<Channel<RunEvent>> Record(RunEvent runEvent)
        {
            lock (_gate)
            {
                _history.Enqueue(runEvent);
                while (_history.Count > ReplayBufferSize)
                {
                    _history.Dequeue();
                }

                return [.. _channels];
            }
        }

        public void Attach(Channel<RunEvent> channel, out bool completed)
        {
            lock (_gate)
            {
                foreach (var buffered in _history)
                {
                    channel.Writer.TryWrite(buffered);
                }

                _channels.Add(channel);
                completed = _completed;
            }
        }

        public bool Detach(Channel<RunEvent> channel)
        {
            lock (_gate)
            {
                _channels.Remove(channel);
                return _channels.Count == 0 && _completed;
            }
        }

        public bool Complete()
        {
            lock (_gate)
            {
                _completed = true;
                foreach (var channel in _channels)
                {
                    channel.Writer.TryComplete();
                }

                return _channels.Count == 0;
            }
        }
    }
}
