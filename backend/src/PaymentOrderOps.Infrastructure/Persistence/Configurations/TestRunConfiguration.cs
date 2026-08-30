using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

public sealed class TestRunConfiguration : IEntityTypeConfiguration<TestRun>
{
    public void Configure(EntityTypeBuilder<TestRun> builder)
    {
        builder.ToTable("TestRuns");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.ScenarioId).IsRequired();
        builder.Property(x => x.ScenarioKey).IsRequired().HasMaxLength(TestScenario.KeyMaxLength);
        builder.Property(x => x.ProfileId);
        builder.Property(x => x.Environment).IsRequired().HasMaxLength(16).HasConversion<string>()
            .HasDefaultValue(ServiceEnvironment.Dev);
        builder.Property(x => x.Status).IsRequired().HasMaxLength(16).HasConversion<string>();
        builder.Property(x => x.TriggeredBy).IsRequired().HasMaxLength(128);
        builder.Property(x => x.ParentRunId);
        builder.Property(x => x.RepeatCount);
        builder.Property(x => x.RepeatConcurrency);
        builder.Property(x => x.StartedAtUtc);
        builder.Property(x => x.FinishedAtUtc);
        builder.Property(x => x.Error).HasMaxLength(4000);
        builder.Property(x => x.CreatedAtUtc).IsRequired();

        builder.Property(x => x.RunParams)
            .HasColumnName("RunParams")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasConversion(
                value => TestRunsJson.Serialize(value),
                json => TestRunsJson.Deserialize<Dictionary<string, JsonNode?>>(json)
                        ?? new Dictionary<string, JsonNode?>(StringComparer.Ordinal))
            .Metadata.SetValueComparer(TestRunsJson.Comparer<Dictionary<string, JsonNode?>>());

        builder.Property(x => x.Variables)
            .HasColumnName("Variables")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasConversion(
                value => TestRunsJson.Serialize(value),
                json => TestRunsJson.Deserialize<Dictionary<string, JsonNode?>>(json)
                        ?? new Dictionary<string, JsonNode?>(StringComparer.Ordinal))
            .Metadata.SetValueComparer(TestRunsJson.Comparer<Dictionary<string, JsonNode?>>());

        builder.Property(x => x.Summary)
            .HasColumnName("Summary")
            .HasColumnType("jsonb")
            .HasConversion(
                value => value == null ? null : TestRunsJson.Serialize(value),
                json => TestRunsJson.Deserialize<BulkRunSummary>(json))
            .Metadata.SetValueComparer(TestRunsJson.Comparer<BulkRunSummary>());

        builder.HasMany(x => x.Steps)
            .WithOne()
            .HasForeignKey(x => x.TestRunId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(x => x.Steps)
            .HasField("_steps")
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasOne<TestRun>()
            .WithMany()
            .HasForeignKey(x => x.ParentRunId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.Environment, x.Status }).HasDatabaseName("IX_TestRuns_Environment_Status");
        builder.HasIndex(x => x.ScenarioId).HasDatabaseName("IX_TestRuns_ScenarioId");
        builder.HasIndex(x => x.ParentRunId).HasDatabaseName("IX_TestRuns_ParentRunId");
        builder.HasIndex(x => x.CreatedAtUtc).HasDatabaseName("IX_TestRuns_CreatedAtUtc");
    }
}
