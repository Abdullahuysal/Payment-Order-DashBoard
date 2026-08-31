using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Todo.V1.Shared;

internal static class TodoWriteRules
{
    public static Task<bool> DuplicateOwnerExistsAsync(AppDbContext db, string normalizedKey, CancellationToken ct) =>
        db.TodoOwners.AnyAsync(o => o.NormalizedName == normalizedKey, ct);

    public static ProblemHttpResult DuplicateOwnerProblem(string name) =>
        TypedResults.Problem(
            title: "Duplicate owner name.",
            detail: $"An owner named '{name}' already exists.",
            statusCode: StatusCodes.Status409Conflict);

    public static ProblemHttpResult OwnerNotFoundProblem(Guid ownerId) =>
        TypedResults.Problem(
            title: "Owner not found.",
            detail: $"No owner exists with id '{ownerId}'.",
            statusCode: StatusCodes.Status404NotFound);

    public static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
