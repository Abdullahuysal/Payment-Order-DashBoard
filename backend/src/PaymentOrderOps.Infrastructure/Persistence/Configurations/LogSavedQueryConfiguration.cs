using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentOrderOps.Domain.Logs;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

public sealed class LogSavedQueryConfiguration : IEntityTypeConfiguration<LogSavedQuery>
{
    private static readonly JsonSerializerOptions QueryJsonOptions = new(JsonSerializerDefaults.Web);

    public void Configure(EntityTypeBuilder<LogSavedQuery> builder)
    {
        builder.ToTable("LogSavedQueries");

        builder.HasKey(x => x.Environment);
        builder.Property(x => x.Environment).HasMaxLength(16).HasConversion<string>()
            .HasDefaultValue(ServiceEnvironment.Dev);
        builder.Property(x => x.UpdatedAtUtc).IsRequired();

        var comparer = new ValueComparer<List<LogSavedQueryEntry>>(
            (left, right) => Serialize(left) == Serialize(right),
            value => Serialize(value).GetHashCode(StringComparison.Ordinal),
            value => Deserialize(Serialize(value)));

        builder.Property(x => x.Queries)
            .HasColumnName("Queries")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasConversion(value => Serialize(value), json => Deserialize(json))
            .Metadata.SetValueComparer(comparer);
    }

    private static string Serialize(List<LogSavedQueryEntry>? value) =>
        JsonSerializer.Serialize(value ?? [], QueryJsonOptions);

    private static List<LogSavedQueryEntry> Deserialize(string? json) =>
        string.IsNullOrWhiteSpace(json)
            ? []
            : JsonSerializer.Deserialize<List<LogSavedQueryEntry>>(json, QueryJsonOptions) ?? [];
}
