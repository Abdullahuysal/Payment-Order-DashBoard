using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

internal static class TestRunFactory
{
    public static IEnumerable<TestRunStep> PendingSteps(TestScenario scenario)
    {
        var order = 1;
        foreach (var step in scenario.Steps)
        {
            yield return new TestRunStep(Guid.CreateVersion7(), order++, step.Key, step.Title, step.Kind);
        }
    }

    public static IReadOnlyCollection<TestStepKind> RequiredKinds(TestScenario scenario)
    {
        var kinds = new HashSet<TestStepKind>();
        foreach (var step in scenario.Steps)
        {
            switch (step)
            {
                case HttpRequestStep:
                    kinds.Add(TestStepKind.HttpRequest);
                    break;
                case SoapRequestStep:
                    kinds.Add(TestStepKind.SoapRequest);
                    break;
                case DbQueryStep:
                    kinds.Add(TestStepKind.DbQuery);
                    break;
                case PollStep poll:
                    kinds.Add(poll.Read.Soap is not null ? TestStepKind.SoapRequest : TestStepKind.HttpRequest);
                    break;
            }
        }

        return kinds;
    }
}
