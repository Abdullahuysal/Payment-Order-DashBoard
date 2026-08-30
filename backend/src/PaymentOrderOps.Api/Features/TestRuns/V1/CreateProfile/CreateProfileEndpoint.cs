using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.CreateProfile;

internal static class CreateProfileEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPost("scenarios/{idOrKey}/profiles", HandleAsync)
            .WithName("CreateScenarioProfile")
            .WithSummary("Creates a named profile for a scenario in the current environment.");

    private static async Task<Results<Created<ProfileResponse>, ValidationProblem, NotFound, ProblemHttpResult>> HandleAsync(
        string idOrKey,
        CreateProfileRequest request,
        IValidator<CreateProfileRequest> validator,
        AppDbContext db,
        IEnvironmentContext environment,
        HttpContext http,
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

        var name = request.Name!.Trim();
        var normalized = ScenarioProfile.NormalizeName(name);

        if (await ProfileWriteRules.DuplicateExistsAsync(db, scenarioId, environment.Environment, normalized, null, ct))
        {
            return ProfileWriteRules.DuplicateProblem(name);
        }

        var profile = new ScenarioProfile(Guid.CreateVersion7(), scenarioId, environment.Environment, name, request.Values);
        db.ScenarioProfiles.Add(profile);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ProfileWriteRules.IsUniqueViolation(ex))
        {
            return ProfileWriteRules.DuplicateProblem(name);
        }

        var location = $"{http.Request.Path.Value?.TrimEnd('/')}/{profile.Id}";
        return TypedResults.Created(location, profile.ToResponse());
    }
}
