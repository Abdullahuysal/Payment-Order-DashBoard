using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentOrderOps.Domain.Logs;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

public sealed class LogAiSummaryConfiguration : IEntityTypeConfiguration<LogAiSummary>
{
    public void Configure(EntityTypeBuilder<LogAiSummary> builder)
    {
        builder.ToTable("LogAiSummaries");

        builder.HasKey(x => new { x.Environment, x.WindowStartUtc, x.WindowEndUtc, x.FiltersHash });

        builder.Property(x => x.Environment).HasMaxLength(16).HasConversion<string>()
            .HasDefaultValue(ServiceEnvironment.Dev);
        builder.Property(x => x.WindowStartUtc).HasColumnType("timestamp with time zone");
        builder.Property(x => x.WindowEndUtc).HasColumnType("timestamp with time zone");
        builder.Property(x => x.FiltersHash).HasMaxLength(LogAiSummary.FiltersHashLength);
        builder.Property(x => x.Payload).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.Model).HasMaxLength(120).IsRequired();
        builder.Property(x => x.GroupCount).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
    }
}
