using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentOrderOps.Domain.ServiceHealth;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

public sealed class ServiceHealthCheckConfiguration : IEntityTypeConfiguration<ServiceHealthCheck>
{
    private static readonly JsonSerializerOptions HeaderJsonOptions = new(JsonSerializerDefaults.Web);

    public void Configure(EntityTypeBuilder<ServiceHealthCheck> builder)
    {
        builder.ToTable("ServiceHealthChecks");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.Environment).IsRequired().HasMaxLength(16).HasConversion<string>()
            .HasDefaultValue(ServiceEnvironment.Dev);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(ServiceHealthCheck.NameMaxLength);
        builder.Property(x => x.Group).IsRequired().HasMaxLength(16).HasConversion<string>();
        builder.Property(x => x.Method).IsRequired().HasMaxLength(8).HasConversion<string>();
        builder.Property(x => x.Url).IsRequired().HasMaxLength(ServiceHealthCheck.UrlMaxLength);
        builder.Property(x => x.NormalizedUrl).IsRequired().HasMaxLength(ServiceHealthCheck.UrlMaxLength);
        builder.Property(x => x.Body);
        builder.Property(x => x.ExpectedStatusCode).IsRequired().HasDefaultValue(200);
        builder.Property(x => x.IsEnabled).IsRequired().HasDefaultValue(true);
        builder.Property(x => x.Source).IsRequired().HasMaxLength(8).HasConversion<string>();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.Xmin).IsRowVersion();

        var headerComparer = new ValueComparer<Dictionary<string, string>>(
            (left, right) => Serialize(left) == Serialize(right),
            value => Serialize(value).GetHashCode(StringComparison.Ordinal),
            value => Deserialize(Serialize(value)));

        builder.Property(x => x.Headers)
            .HasColumnName("Headers")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasConversion(value => Serialize(value), json => Deserialize(json))
            .Metadata.SetValueComparer(headerComparer);

        builder.HasIndex(x => new { x.Environment, x.Method, x.NormalizedUrl })
            .IsUnique()
            .HasDatabaseName("IX_ServiceHealthChecks_Environment_Method_NormalizedUrl")
            .HasFilter("\"IsDeleted\" = false");

        builder.HasIndex(x => new { x.Environment, x.Group })
            .HasDatabaseName("IX_ServiceHealthChecks_Environment_Group");

        builder.HasQueryFilter("SoftDelete", x => !x.IsDeleted);

        builder.HasData(BuildSeed());
    }

    private static string Serialize(Dictionary<string, string>? value)
        => JsonSerializer.Serialize(value ?? [], HeaderJsonOptions);

    private static Dictionary<string, string> Deserialize(string? json)
        => string.IsNullOrWhiteSpace(json)
            ? new Dictionary<string, string>(StringComparer.Ordinal)
            : JsonSerializer.Deserialize<Dictionary<string, string>>(json, HeaderJsonOptions)
              ?? new Dictionary<string, string>(StringComparer.Ordinal);

    private static IEnumerable<object> BuildSeed()
    {
        foreach (var environment in ServiceHealthSeedData.Environments)
        {
            foreach (var definition in ServiceHealthSeedData.Definitions)
            {
                yield return new
                {
                    Id = ServiceHealthSeedData.IdFor(environment, definition.Ordinal),
                    Environment = environment,
                    definition.Name,
                    definition.Group,
                    Method = ServiceHealthHttpMethod.Get,
                    definition.Url,
                    NormalizedUrl = ServiceHealthCheck.NormalizeUrl(definition.Url),
                    Body = (string?)null,
                    ExpectedStatusCode = 200,
                    IsEnabled = true,
                    Source = ServiceHealthSource.Builtin,
                    CreatedAtUtc = ServiceHealthSeedData.Timestamp,
                    UpdatedAtUtc = ServiceHealthSeedData.Timestamp,
                    IsDeleted = false,
                    Headers = new Dictionary<string, string>(),
                };
            }
        }
    }
}
