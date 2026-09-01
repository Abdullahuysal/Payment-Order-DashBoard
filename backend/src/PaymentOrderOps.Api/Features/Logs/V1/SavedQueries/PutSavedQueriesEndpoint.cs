using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.Logs.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.Logs;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Logs.V1.SavedQueries;

internal static class PutSavedQueriesEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPut("saved-queries", HandleAsync)
            .WithName("ReplaceSavedLogQueries")
            .WithSummary("Replaces the current environment's saved log queries. Upsert, last-write-wins.");

    private static async Task<Results<Ok<SavedLogQueriesResponse>, ValidationProblem>> HandleAsync(
        UpdateSavedLogQueriesRequest request,
        IValidator<UpdateSavedLogQueriesRequest> validator,
        AppDbContext db,
        IEnvironmentContext environment,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var entries = (request.Queries ?? [])
            .Select(q => new LogSavedQueryEntry(q.Name ?? string.Empty, q.Text, q.Level, q.Service, q.TraceId));

        var saved = await db.LogSavedQueries
            .FirstOrDefaultAsync(q => q.Environment == environment.Environment, ct);

        if (saved is null)
        {
            saved = new LogSavedQuery(environment.Environment, entries);
            db.LogSavedQueries.Add(saved);
        }
        else
        {
            saved.Replace(entries);
        }

        await db.SaveChangesAsync(ct);
        return TypedResults.Ok(saved.ToResponse());
    }
}
