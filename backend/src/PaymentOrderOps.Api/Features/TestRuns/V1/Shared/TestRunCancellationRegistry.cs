using System.Collections.Concurrent;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>
/// Owned by the worker: a live map of run id → its <see cref="CancellationTokenSource"/> while
/// executing. <c>POST /{runId}/cancel</c> trips it; a run not present here is either queued or
/// already terminal.
/// </summary>
public sealed class TestRunCancellationRegistry
{
    private readonly ConcurrentDictionary<Guid, CancellationTokenSource> _running = new();

    public CancellationTokenSource Register(Guid runId, CancellationToken linkedTo)
    {
        var cts = CancellationTokenSource.CreateLinkedTokenSource(linkedTo);
        _running[runId] = cts;
        return cts;
    }

    public void Release(Guid runId)
    {
        if (_running.TryRemove(runId, out var cts))
        {
            cts.Dispose();
        }
    }

    public bool IsExecuting(Guid runId) => _running.ContainsKey(runId);

    public bool RequestCancel(Guid runId)
    {
        if (!_running.TryGetValue(runId, out var cts))
        {
            return false;
        }

        cts.Cancel();
        return true;
    }
}
