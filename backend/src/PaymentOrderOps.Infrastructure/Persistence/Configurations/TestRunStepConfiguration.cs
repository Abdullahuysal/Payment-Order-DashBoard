using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

public sealed class TestRunStepConfiguration : IEntityTypeConfiguration<TestRunStep>
{
    public void Configure(EntityTypeBuilder<TestRunStep> builder)
    {
        builder.ToTable("TestRunSteps");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.TestRunId).IsRequired();
        builder.Property(x => x.Order).IsRequired();
        builder.Property(x => x.Key).IsRequired().HasMaxLength(120);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(300);
        builder.Property(x => x.Kind).IsRequired().HasMaxLength(16).HasConversion<string>();
        builder.Property(x => x.Status).IsRequired().HasMaxLength(16).HasConversion<string>();
        builder.Property(x => x.DurationMs);
        builder.Property(x => x.Attempts).IsRequired().HasDefaultValue(0);
        builder.Property(x => x.Error).HasMaxLength(4000);
        builder.Property(x => x.StartedAtUtc);
        builder.Property(x => x.FinishedAtUtc);

        builder.Property(x => x.RequestJson)
            .HasColumnName("RequestJson")
            .HasColumnType("jsonb")
            .HasConversion(
                value => value == null ? null : value.ToJsonString(TestRunsJson.Options),
                json => string.IsNullOrWhiteSpace(json) ? null : JsonNode.Parse(json))
            .Metadata.SetValueComparer(TestRunsJson.Comparer<JsonNode>());

        builder.Property(x => x.ResponseJson)
            .HasColumnName("ResponseJson")
            .HasColumnType("jsonb")
            .HasConversion(
                value => value == null ? null : value.ToJsonString(TestRunsJson.Options),
                json => string.IsNullOrWhiteSpace(json) ? null : JsonNode.Parse(json))
            .Metadata.SetValueComparer(TestRunsJson.Comparer<JsonNode>());

        builder.HasIndex(x => new { x.TestRunId, x.Order }).HasDatabaseName("IX_TestRunSteps_TestRunId_Order");
    }
}
