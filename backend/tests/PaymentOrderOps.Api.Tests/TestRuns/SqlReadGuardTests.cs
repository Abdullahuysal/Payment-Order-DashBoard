using PaymentOrderOps.Infrastructure.TestRuns;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class SqlReadGuardTests
{
    [Theory]
    [InlineData("SELECT id, state FROM dbo.Orders WHERE id = @p0")]
    [InlineData("  select 1 as ready ")]
    [InlineData("WITH x AS (SELECT 1 AS n) SELECT n FROM x")]
    [InlineData("SELECT /* comment */ 1")]
    public void Accepts_read_only_statements(string sql) =>
        Assert.True(SqlReadGuard.IsReadOnly(sql, out _));

    [Theory]
    [InlineData("UPDATE dbo.Orders SET state = 'x'")]
    [InlineData("DELETE FROM dbo.Orders")]
    [InlineData("INSERT INTO dbo.Orders (id) VALUES (1)")]
    [InlineData("SELECT 1; DROP TABLE dbo.Orders")]
    [InlineData("SELECT * INTO #tmp FROM dbo.Orders")]
    [InlineData("EXEC sp_who")]
    [InlineData("TRUNCATE TABLE dbo.Orders")]
    [InlineData("")]
    public void Rejects_writes_and_multi_statement(string sql)
    {
        Assert.False(SqlReadGuard.IsReadOnly(sql, out var reason));
        Assert.False(string.IsNullOrWhiteSpace(reason));
    }
}
