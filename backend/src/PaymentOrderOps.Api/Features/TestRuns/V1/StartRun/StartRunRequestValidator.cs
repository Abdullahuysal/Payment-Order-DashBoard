using FluentValidation;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Infrastructure.TestRuns;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.StartRun;

public sealed class StartRunRequestValidator : AbstractValidator<StartRunRequest>
{
    public StartRunRequestValidator(TestRunsOptions limits)
    {
        RuleFor(x => x.ScenarioId).NotEmpty();

        When(x => x.Repeat is not null, () =>
        {
            RuleFor(x => x.Repeat!.Count)
                .InclusiveBetween(1, limits.MaxBulkCount)
                .WithMessage($"repeat.count must be between 1 and {limits.MaxBulkCount}.");
            RuleFor(x => x.Repeat!.Concurrency)
                .InclusiveBetween(1, limits.MaxBulkConcurrency)
                .WithMessage($"repeat.concurrency must be between 1 and {limits.MaxBulkConcurrency}.");
        });
    }
}
