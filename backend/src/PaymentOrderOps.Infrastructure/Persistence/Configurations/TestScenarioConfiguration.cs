using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

public sealed class TestScenarioConfiguration : IEntityTypeConfiguration<TestScenario>
{
    public void Configure(EntityTypeBuilder<TestScenario> builder)
    {
        builder.ToTable("TestScenarios");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.Key).IsRequired().HasMaxLength(TestScenario.KeyMaxLength);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(TestScenario.NameMaxLength);
        builder.Property(x => x.Description).IsRequired().HasMaxLength(1024);
        builder.Property(x => x.Kind).IsRequired().HasMaxLength(16).HasConversion<string>();
        builder.Property(x => x.SupportsRepeat).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc).IsRequired();

        builder.Property(x => x.Inputs)
            .HasColumnName("Inputs")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasConversion(
                value => TestRunsJson.Serialize(value),
                json => TestRunsJson.Deserialize<List<InputField>>(json) ?? new List<InputField>())
            .Metadata.SetValueComparer(TestRunsJson.Comparer<List<InputField>>());

        builder.Property(x => x.Steps)
            .HasColumnName("Steps")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasConversion(
                value => TestRunsJson.Serialize(value),
                json => TestRunsJson.Deserialize<List<ScenarioStep>>(json) ?? new List<ScenarioStep>())
            .Metadata.SetValueComparer(TestRunsJson.Comparer<List<ScenarioStep>>());

        builder.HasIndex(x => x.Key).IsUnique().HasDatabaseName("IX_TestScenarios_Key");

        builder.HasData(TestRunSeedData.BuildScenarioRows());
    }
}
