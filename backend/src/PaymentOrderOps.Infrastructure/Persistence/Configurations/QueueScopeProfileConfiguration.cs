using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentOrderOps.Domain.Messaging;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

public sealed class QueueScopeProfileConfiguration : IEntityTypeConfiguration<QueueScopeProfile>
{
    private static readonly JsonSerializerOptions PatternJsonOptions = new(JsonSerializerDefaults.Web);

    public void Configure(EntityTypeBuilder<QueueScopeProfile> builder)
    {
        builder.ToTable("QueueScopeProfiles");

        builder.HasKey(x => x.Environment);
        builder.Property(x => x.Environment).HasMaxLength(16).HasConversion<string>()
            .HasDefaultValue(ServiceEnvironment.Dev);
        builder.Property(x => x.UpdatedAtUtc).IsRequired();

        var comparer = new ValueComparer<List<string>>(
            (left, right) => Serialize(left) == Serialize(right),
            value => Serialize(value).GetHashCode(StringComparison.Ordinal),
            value => Deserialize(Serialize(value)));

        builder.Property(x => x.Patterns)
            .HasColumnName("Patterns")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasConversion(value => Serialize(value), json => Deserialize(json))
            .Metadata.SetValueComparer(comparer);
    }

    private static string Serialize(List<string>? value) => JsonSerializer.Serialize(value ?? [], PatternJsonOptions);

    private static List<string> Deserialize(string? json) =>
        string.IsNullOrWhiteSpace(json) ? [] : JsonSerializer.Deserialize<List<string>>(json, PatternJsonOptions) ?? [];
}
