using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentOrderOps.Domain.Todo;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

public sealed class TodoOwnerConfiguration : IEntityTypeConfiguration<TodoOwner>
{
    public void Configure(EntityTypeBuilder<TodoOwner> builder)
    {
        builder.ToTable("TodoOwners");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.Name).IsRequired().HasMaxLength(TodoOwner.NameMaxLength);
        builder.Property(x => x.NormalizedName).IsRequired().HasMaxLength(TodoOwner.NameMaxLength);

        builder.HasIndex(x => x.NormalizedName)
            .IsUnique()
            .HasDatabaseName("IX_TodoOwners_NormalizedName");
    }
}
