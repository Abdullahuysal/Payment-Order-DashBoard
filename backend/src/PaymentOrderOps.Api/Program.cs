using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Shared;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.CreateCheck;
using PaymentOrderOps.Api.Features.ServiceHealth.V1.Shared;
using PaymentOrderOps.Api.Features.TestRuns.V1.Shared;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Api.Infrastructure.Endpoints;
using PaymentOrderOps.Api.Options;
using PaymentOrderOps.Infrastructure.Messaging;
using PaymentOrderOps.Infrastructure;
using PaymentOrderOps.Infrastructure.Persistence;
using Scalar.AspNetCore;
using Serilog;

const string corsPolicyName = "frontend";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSerilog((services, configuration) => configuration
    .ReadFrom.Configuration(builder.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.Configure<CorsSettings>(builder.Configuration.GetSection(CorsSettings.SectionName));
var corsSettings = builder.Configuration.GetSection(CorsSettings.SectionName).Get<CorsSettings>() ?? new CorsSettings();
builder.Services.AddCors(options => options.AddPolicy(corsPolicyName, policy => policy
    .WithOrigins(corsSettings.AllowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .WithExposedHeaders(CorrelationIdMiddleware.HeaderName)));

builder.Services.AddApiVersioningStack();

builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
{
    context.ProblemDetails.Instance ??= $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}";
    context.ProblemDetails.Extensions["correlationId"] = context.HttpContext.TraceIdentifier;
});
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddOpenApi();
builder.Services.AddValidatorsFromAssemblyContaining<CreateServiceHealthCheckRequestValidator>();

builder.Services.AddScoped<EnvironmentContextHolder>();
builder.Services.AddScoped<IEnvironmentContext>(sp => sp.GetRequiredService<EnvironmentContextHolder>());

builder.Services.AddPersistence(builder.Configuration);

builder.Services.AddServiceHealthProbe(builder.Configuration);

builder.Services.AddMessageBrokers(builder.Configuration);
builder.Services.AddScoped<MessageBrokerResolver>();
builder.Services.AddScoped<QueueScopeResolver>();

builder.Services.AddTestRuns(builder.Configuration);
builder.Services.AddHostedService<TestRunWorker>();

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database", tags: ["ready"]);

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors(corsPolicyName);

app.MapOpenApi();
app.MapScalarApiReference();

var versionSet = app.BuildApiVersionSet();

app.MapFeatureModules(versionSet);

app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready"),
});
app.MapHealthChecks("/alive", new HealthCheckOptions
{
    Predicate = _ => false,
});

if (app.Environment.IsDevelopment())
{
    await app.Services.ApplyMigrationsAsync();
}

await app.RunAsync();

public partial class Program;
