using System.Threading.Channels;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>In-process hand-off of queued run ids to the single <c>TestRunWorker</c>.</summary>
public sealed class TestRunQueue
{
    private readonly Channel<Guid> _channel = Channel.CreateUnbounded<Guid>(
        new UnboundedChannelOptions { SingleReader = true });

    public ValueTask EnqueueAsync(Guid runId, CancellationToken ct = default) =>
        _channel.Writer.WriteAsync(runId, ct);

    public IAsyncEnumerable<Guid> DequeueAllAsync(CancellationToken ct) =>
        _channel.Reader.ReadAllAsync(ct);
}
