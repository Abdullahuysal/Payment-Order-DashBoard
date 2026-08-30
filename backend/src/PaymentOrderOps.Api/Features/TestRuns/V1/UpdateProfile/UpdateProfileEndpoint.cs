using System.Globalization;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.UpdateProfile;

internal static class UpdateProfileEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPut("scenarios/{idOrKey}/profiles/{profileId:guid}", HandleAsync)
            .WithName("UpdateScenarioProfile")
            .WithSummary("Replaces a profile. Pass rowVersion to get a 409 on a stale write instead of last-write-wins.");

    private static async Task<Results<Ok<ProfileResponse>, ValidationProblem, NotFound, ProblemHttpResult>> HandleAsync(
        string idOrKey,
        Guid profileId,
        UpdateProfileRequest request,
        IValidator<UpdateProfileRequest> validator,
        AppDbContext db,
        IEnvironmentContext environment,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var scenarioId = await ScenarioLookup.FindIdAsync(db, idOrKey, ct);
        if (scenarioId == Guid.Empty)
        {
            return TypedResults.NotFound();
        }

        var profile = await db.ScenarioProfiles
            .FirstOrDefaultAsync(
                p => p.Id == profileId && p.ScenarioId == scenarioId && p.Environment == environment.Environment, ct);
        if (profile is null)
        {
            return TypedResults.NotFound();
        }

        var name = request.Name!.Trim();
        var normalized = ScenarioProfile.NormalizeName(name);
        if (await ProfileWriteRules.DuplicateExistsAsync(db, scenarioId, environment.Environment, normalized, profileId, ct))
        {
            return ProfileWriteRules.DuplicateProblem(name);
        }

        profile.Update(name, request.Values);

        if (!string.IsNullOrWhiteSpace(request.RowVersion)
            && uint.TryParse(request.RowVersion, NumberStyles.Integer, CultureInfo.InvariantCulture, out var expectedXmin))
        {
            db.Entry(profile).Property(p => p.Xmin).OriginalValue = expectedXmin;
        }

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return TypedResults.Problem(
                title: "The profile was modified by another request.",
                detail: "Re-read the profile and retry with the latest rowVersion.",
                statusCode: StatusCodes.Status409Conflict);
        }
        catch (DbUpdateException ex) when (ProfileWriteRules.IsUniqueViolation(ex))
        {
            return ProfileWriteRules.DuplicateProblem(name);
        }

        return TypedResults.Ok(profile.ToResponse());
    }
}
