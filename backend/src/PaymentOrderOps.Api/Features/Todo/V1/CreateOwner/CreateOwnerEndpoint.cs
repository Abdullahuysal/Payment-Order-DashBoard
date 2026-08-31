using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.Todo.V1.Shared;
using PaymentOrderOps.Domain.Todo;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Todo.V1.CreateOwner;

internal static class CreateOwnerEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPost("owners", HandleAsync)
            .WithName("CreateTodoOwner")
            .WithSummary("Creates a todo owner. A duplicate normalized name answers 409.");

    private static async Task<Results<Created<TodoOwnerResponse>, ValidationProblem, ProblemHttpResult>> HandleAsync(
        CreateOwnerRequest request,
        IValidator<CreateOwnerRequest> validator,
        AppDbContext db,
        HttpContext http,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var displayName = TodoOwner.NormalizeName(request.Name!);
        var key = TodoOwner.NormalizeKey(request.Name!);

        if (await TodoWriteRules.DuplicateOwnerExistsAsync(db, key, ct))
        {
            return TodoWriteRules.DuplicateOwnerProblem(displayName);
        }

        var owner = new TodoOwner(Guid.CreateVersion7(), request.Name!);
        db.TodoOwners.Add(owner);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (TodoWriteRules.IsUniqueViolation(ex))
        {
            return TodoWriteRules.DuplicateOwnerProblem(displayName);
        }

        var location = $"{http.Request.Path.Value?.TrimEnd('/')}/{owner.Id}";
        return TypedResults.Created(location, owner.ToResponse());
    }
}
