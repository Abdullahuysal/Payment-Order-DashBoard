using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

public sealed class ScenarioProfileConfiguration : IEntityTypeConfiguration<ScenarioProfile>
{
    public void Configure(EntityTypeBuilder<ScenarioProfile> builder)
    {
        builder.ToTable("ScenarioProfiles");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.ScenarioId).IsRequired();
        builder.Property(x => x.Environment).IsRequired().HasMaxLength(16).HasConversion<string>()
            .HasDefaultValue(ServiceEnvironment.Dev);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(ScenarioProfile.NameMaxLength);
        builder.Property(x => x.NormalizedName).IsRequired().HasMaxLength(ScenarioProfile.NameMaxLength);
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc).IsRequired();
        builder.Property(x => x.Xmin).IsRowVersion();

        builder.Property(x => x.Values)
            .HasColumnName("Values")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasConversion(
                value => TestRunsJson.Serialize(value),
                json => TestRunsJson.Deserialize<Dictionary<string, JsonNode?>>(json)
                        ?? new Dictionary<string, JsonNode?>(StringComparer.Ordinal))
            .Metadata.SetValueComparer(TestRunsJson.Comparer<Dictionary<string, JsonNode?>>());

        builder.HasOne<TestScenario>()
            .WithMany()
            .HasForeignKey(x => x.ScenarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.ScenarioId, x.Environment, x.NormalizedName })
            .IsUnique()
            .HasDatabaseName("IX_ScenarioProfiles_ScenarioId_Environment_NormalizedName");
    }
}
