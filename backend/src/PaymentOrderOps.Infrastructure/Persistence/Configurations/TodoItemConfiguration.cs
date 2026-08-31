using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentOrderOps.Domain.Todo;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

public sealed class TodoItemConfiguration : IEntityTypeConfiguration<TodoItem>
{
    public void Configure(EntityTypeBuilder<TodoItem> builder)
    {
        builder.ToTable("TodoItems");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.Title).IsRequired().HasMaxLength(TodoItem.TitleMaxLength);
        builder.Property(x => x.Description).HasMaxLength(TodoItem.DescriptionMaxLength);
        builder.Property(x => x.OwnerId).IsRequired();
        builder.Property(x => x.Status).IsRequired().HasMaxLength(16).HasConversion<string>();
        builder.Property(x => x.Priority).IsRequired().HasMaxLength(16).HasConversion<string>();
        builder.Property(x => x.DueDate);
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc).IsRequired();
        builder.Property(x => x.Xmin).IsRowVersion();

        builder.HasOne<TodoOwner>()
            .WithMany()
            .HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.OwnerId)
            .HasDatabaseName("IX_TodoItems_OwnerId");
    }
}
