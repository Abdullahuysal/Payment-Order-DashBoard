using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.Messaging;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1.Scope;

internal static class PutScopeEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPut("scope", HandleAsync)
            .WithName("ReplaceMessageQueueScope")
            .WithSummary("Replaces the current environment's domain scope. Writes a local preference row; never touches a broker.");

    private static async Task<Results<Ok<QueueScopeResponse>, ValidationProblem>> HandleAsync(
        UpdateQueueScopeRequest request,
        IValidator<UpdateQueueScopeRequest> validator,
        AppDbContext db,
        IEnvironmentContext environment,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var profile = await db.QueueScopeProfiles
            .FirstOrDefaultAsync(p => p.Environment == environment.Environment, ct);

        if (profile is null)
        {
            profile = new QueueScopeProfile(environment.Environment, request.Patterns);
            db.QueueScopeProfiles.Add(profile);
        }
        else
        {
            profile.Replace(request.Patterns);
        }

        await db.SaveChangesAsync(ct);
        return TypedResults.Ok(new QueueScopeResponse(profile.Patterns, profile.UpdatedAtUtc));
    }
}
