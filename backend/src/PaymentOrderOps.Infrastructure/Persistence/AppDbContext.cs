using Microsoft.EntityFrameworkCore;
using PaymentOrderOps.Domain.Logs;
using PaymentOrderOps.Domain.Messaging;
using PaymentOrderOps.Domain.ServiceHealth;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Domain.Todo;

namespace PaymentOrderOps.Infrastructure.Persistence;

public sealed class AppDbContext : DbContext
{
    private readonly TimeProvider _timeProvider;

    public AppDbContext(DbContextOptions<AppDbContext> options, TimeProvider? timeProvider = null)
        : base(options)
    {
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public DbSet<ServiceHealthCheck> ServiceHealthChecks => Set<ServiceHealthCheck>();

    public DbSet<QueueScopeProfile> QueueScopeProfiles => Set<QueueScopeProfile>();

    public DbSet<LogAiSummary> LogAiSummaries => Set<LogAiSummary>();

    public DbSet<LogSavedQuery> LogSavedQueries => Set<LogSavedQuery>();

    public DbSet<TestScenario> TestScenarios => Set<TestScenario>();

    public DbSet<ScenarioProfile> ScenarioProfiles => Set<ScenarioProfile>();

    public DbSet<TestRun> TestRuns => Set<TestRun>();

    public DbSet<TestRunStep> TestRunSteps => Set<TestRunStep>();

    public DbSet<TodoOwner> TodoOwners => Set<TodoOwner>();

    public DbSet<TodoItem> TodoItems => Set<TodoItem>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampAudit();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        StampAudit();
        return base.SaveChanges();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    private void StampAudit()
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;

        foreach (var entry in ChangeTracker.Entries<ServiceHealthCheck>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Property(e => e.CreatedAtUtc).CurrentValue = now;
                    entry.Property(e => e.UpdatedAtUtc).CurrentValue = now;
                    break;
                case EntityState.Modified:
                    entry.Property(e => e.CreatedAtUtc).IsModified = false;
                    entry.Property(e => e.UpdatedAtUtc).CurrentValue = now;
                    break;
            }
        }

        foreach (var entry in ChangeTracker.Entries<QueueScopeProfile>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                entry.Property(e => e.UpdatedAtUtc).CurrentValue = now;
            }
        }

        foreach (var entry in ChangeTracker.Entries<LogSavedQuery>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                entry.Property(e => e.UpdatedAtUtc).CurrentValue = now;
            }
        }

        foreach (var entry in ChangeTracker.Entries<LogAiSummary>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Property(e => e.CreatedAtUtc).CurrentValue = now;
            }
        }

        foreach (var entry in ChangeTracker.Entries<TestScenario>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Property(e => e.CreatedAtUtc).CurrentValue = now;
                    entry.Property(e => e.UpdatedAtUtc).CurrentValue = now;
                    break;
                case EntityState.Modified:
                    entry.Property(e => e.CreatedAtUtc).IsModified = false;
                    entry.Property(e => e.UpdatedAtUtc).CurrentValue = now;
                    break;
            }
        }

        foreach (var entry in ChangeTracker.Entries<ScenarioProfile>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Property(e => e.CreatedAtUtc).CurrentValue = now;
                    entry.Property(e => e.UpdatedAtUtc).CurrentValue = now;
                    break;
                case EntityState.Modified:
                    entry.Property(e => e.CreatedAtUtc).IsModified = false;
                    entry.Property(e => e.UpdatedAtUtc).CurrentValue = now;
                    break;
            }
        }

        foreach (var entry in ChangeTracker.Entries<TestRun>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Property(e => e.CreatedAtUtc).CurrentValue = now;
            }
        }

        foreach (var entry in ChangeTracker.Entries<TodoItem>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Property(e => e.CreatedAtUtc).CurrentValue = now;
                    entry.Property(e => e.UpdatedAtUtc).CurrentValue = now;
                    break;
                case EntityState.Modified:
                    entry.Property(e => e.CreatedAtUtc).IsModified = false;
                    entry.Property(e => e.UpdatedAtUtc).CurrentValue = now;
                    break;
            }
        }
    }
}
