using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Api.Features.Logs.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Domain.Logs;
using PaymentOrderOps.Infrastructure.Ai;
using PaymentOrderOps.Infrastructure.Logs;
using PaymentOrderOps.Infrastructure.Persistence;

namespace PaymentOrderOps.Api.Features.Logs.V1.AiSummary;

internal static class CreateAiSummaryEndpoint
{
    private static readonly JsonSerializerOptions PayloadJson = new(JsonSerializerDefaults.Web);

    public static RouteHandlerBuilder Map(RouteGroupBuilder group) =>
        group.MapPost("ai-summary", HandleAsync)
            .WithName("CreateLogAiSummary")
            .WithSummary("Returns a cached AI summary for the window/filters, or groups + summarizes + stores a new one.");

    private static async Task<Results<Ok<AiSummaryResponse>, ValidationProblem>> HandleAsync(
        CreateAiSummaryRequest request,
        IValidator<CreateAiSummaryRequest> validator,
        LogSearchResolver resolver,
        ILogSearchGateway logs,
        IAiSummarizer summarizer,
        AppDbContext db,
        IEnvironmentContext environment,
        TimeProvider clock,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var elasticsearch = resolver.RequireElasticsearch();

        var windowStart = request.From.UtcDateTime;
        var windowEnd = request.To.UtcDateTime;
        var filters = request.Filters;
        var filtersHash = LogFiltersHash.Compute(filters?.Text, filters?.Level, filters?.Service, filters?.TraceId);

        var cached = await db.LogAiSummaries.AsNoTracking().FirstOrDefaultAsync(
            s => s.Environment == environment.Environment
                 && s.WindowStartUtc == windowStart
                 && s.WindowEndUtc == windowEnd
                 && s.FiltersHash == filtersHash,
            ct);

        if (cached is not null && request.Force != true)
        {
            var stored = JsonSerializer.Deserialize<AiSummaryResponse>(cached.Payload, PayloadJson);
            if (stored is not null)
            {
                return TypedResults.Ok(stored with { Cached = true });
            }
        }

        var groups = await logs.ListExceptionsAsync(elasticsearch, request.From, request.To, filters?.Service, ct);

        var connection = resolver.RequireAi();
        var summary = await summarizer.SummarizeAsync(connection, groups, request.From, request.To, ct);

        var response = summary.ToResponse(
            groups,
            request.From,
            request.To,
            connection.Options.Model,
            cached: false,
            generatedAt: clock.GetUtcNow());

        var payload = JsonSerializer.Serialize(response, PayloadJson);

        var entity = await db.LogAiSummaries.FirstOrDefaultAsync(
            s => s.Environment == environment.Environment
                 && s.WindowStartUtc == windowStart
                 && s.WindowEndUtc == windowEnd
                 && s.FiltersHash == filtersHash,
            ct);

        if (entity is null)
        {
            db.LogAiSummaries.Add(new LogAiSummary(
                environment.Environment, windowStart, windowEnd, filtersHash, payload, connection.Options.Model, groups.Count));
        }
        else
        {
            entity.Refresh(payload, connection.Options.Model, groups.Count);
        }

        await db.SaveChangesAsync(ct);
        return TypedResults.Ok(response);
    }
}
