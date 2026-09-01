using FluentValidation;
using PaymentOrderOps.Domain.Logs;

namespace PaymentOrderOps.Api.Features.Logs.V1.SavedQueries;

public sealed class UpdateSavedLogQueriesRequestValidator : AbstractValidator<UpdateSavedLogQueriesRequest>
{
    public UpdateSavedLogQueriesRequestValidator()
    {
        RuleFor(x => x.Queries).NotNull();

        RuleFor(x => x.Queries!)
            .Must(queries => queries.Count <= LogSavedQuery.MaxQueries)
            .WithMessage($"At most {LogSavedQuery.MaxQueries} saved queries are allowed.")
            .When(x => x.Queries is not null);

        RuleForEach(x => x.Queries!)
            .Must(entry => !string.IsNullOrWhiteSpace(entry.Name) && entry.Name!.Trim().Length <= LogSavedQuery.NameMaxLength)
            .WithMessage($"Each saved query needs a non-empty name of at most {LogSavedQuery.NameMaxLength} characters.")
            .When(x => x.Queries is not null);

        RuleForEach(x => x.Queries!)
            .Must(entry => Fits(entry.Text) && Fits(entry.Level) && Fits(entry.Service) && Fits(entry.TraceId))
            .WithMessage($"Saved query fields must be at most {LogSavedQuery.FieldMaxLength} characters.")
            .When(x => x.Queries is not null);
    }

    private static bool Fits(string? value) => value is null || value.Trim().Length <= LogSavedQuery.FieldMaxLength;
}
