using Microsoft.Data.SqlClient;

namespace PaymentOrderOps.Infrastructure.TestRuns;

public interface ICompanyDbReader
{
    Task<DbQueryResult> QueryAsync(
        string reference,
        CompanyDbOptions target,
        string sql,
        IReadOnlyList<object?> parameters,
        int maxRows,
        CancellationToken ct);
}

/// <summary>
/// Read-only T-SQL reader for the company database. Enforces <see cref="SqlReadGuard"/> and
/// binds positional parameters as <c>@p0</c>, <c>@p1</c>, … The connection string should use a
/// <c>db_datareader</c>-only account.
/// </summary>
public sealed class SqlServerCompanyDbReader : ICompanyDbReader
{
    public async Task<DbQueryResult> QueryAsync(
        string reference,
        CompanyDbOptions target,
        string sql,
        IReadOnlyList<object?> parameters,
        int maxRows,
        CancellationToken ct)
    {
        if (!SqlReadGuard.IsReadOnly(sql, out var reason))
        {
            throw new InvalidOperationException($"dbQuery rejected: {reason}");
        }

        try
        {
            await using var connection = new SqlConnection(target.ConnectionString);
            await connection.OpenAsync(ct);

            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            command.CommandTimeout = Math.Max(1, target.CommandTimeoutSeconds);

            for (var i = 0; i < parameters.Count; i++)
            {
                command.Parameters.AddWithValue($"@p{i}", parameters[i] ?? DBNull.Value);
            }

            await using var reader = await command.ExecuteReaderAsync(ct);
            var rows = new List<IReadOnlyDictionary<string, object?>>();

            while (await reader.ReadAsync(ct) && rows.Count < maxRows)
            {
                var row = new Dictionary<string, object?>(reader.FieldCount, StringComparer.OrdinalIgnoreCase);
                for (var i = 0; i < reader.FieldCount; i++)
                {
                    var value = await reader.IsDBNullAsync(i, ct) ? null : reader.GetValue(i);
                    row[reader.GetName(i)] = value;
                }

                rows.Add(row);
            }

            return new DbQueryResult(rows);
        }
        catch (SqlException ex)
        {
            throw new TestRunTargetUnreachableException("companyDb", reference, ex.Message, ex);
        }
    }
}
