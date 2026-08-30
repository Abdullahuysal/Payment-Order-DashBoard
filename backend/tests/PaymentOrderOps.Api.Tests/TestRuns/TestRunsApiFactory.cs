using System.Collections.Concurrent;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using PaymentOrderOps.Domain.TestRuns;
using PaymentOrderOps.Infrastructure.Persistence;
using PaymentOrderOps.Infrastructure.TestRuns;
using Testcontainers.PostgreSql;
using Xunit;

namespace PaymentOrderOps.Api.Tests.TestRuns;

public sealed class TestRunsApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder("postgres:17-alpine").Build();

    public FakeCompanyApiGateway CompanyApi { get; } = new();

    public FakeSoapServiceGateway Soap { get; } = new();

    public FakeCompanyDbReader Db { get; } = new();

    public async Task InitializeAsync()
    {
        await _database.StartAsync();
        using var scope = Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _database.DisposeAsync();
        await base.DisposeAsync();
    }

    public void ResetFakes()
    {
        CompanyApi.Reset();
        Soap.Reset();
        Db.Reset();
    }

    public HttpClient Client(string environment = "dev")
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add("X-Environment", environment);
        return client;
    }

    public async Task<Guid> InsertScenarioAsync(string key, TestScenarioKind kind, bool supportsRepeat, params ScenarioStep[] steps)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var scenario = new TestScenario(Guid.CreateVersion7(), key, key, "test scenario", kind, [], steps, supportsRepeat);
        db.TestScenarios.Add(scenario);
        await db.SaveChangesAsync();
        return scenario.Id;
    }

    public async Task<JsonObject> PollUntilTerminalAsync(HttpClient client, Guid runId, int timeoutMs = 15000)
    {
        var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
        while (DateTime.UtcNow < deadline)
        {
            var run = await client.GetFromJsonAsync<JsonObject>($"/api/v1/test-runs/{runId}");
            var status = (string?)run!["status"];
            if (status is "passed" or "failed" or "cancelled")
            {
                return run;
            }

            await Task.Delay(150);
        }

        throw new TimeoutException($"Run {runId} did not reach a terminal state within {timeoutMs}ms.");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _database.GetConnectionString(),
                ["CompanyApis:Dev:orders:BaseUrl"] = "https://orders.test.internal",
                ["CompanyApis:Dev:orders:TimeoutSeconds"] = "5",
                ["CompanyApis:Dev:invoices:BaseUrl"] = "https://invoices.test.internal",
                ["CompanyApis:Dev:shipments:BaseUrl"] = "https://shipments.test.internal",
                ["CompanyApis:Dev:merchant:BaseUrl"] = "https://merchant.test.internal",
                ["SoapServices:Dev:invoices:Endpoint"] = "https://soap.test.internal/invoices",
                ["CompanyDb:Dev:ConnectionString"] = "Server=test;Database=company;Trusted_Connection=True;",
                ["CompanyDb:Dev:CommandTimeoutSeconds"] = "5",
                ["Auth:Dev:companyAuth:Kind"] = "static",
                ["Auth:Dev:companyAuth:Header"] = "X-Company-Token",
                ["Auth:Dev:companyAuth:Value"] = "config-secret-abcdef",
                ["TestRuns:AllowedEnvironments:0"] = "dev",
                ["TestRuns:AllowedEnvironments:1"] = "preprod",
                ["TestRuns:MaxBulkCount"] = "10",
                ["TestRuns:MaxBulkConcurrency"] = "5",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<ICompanyApiGateway>();
            services.RemoveAll<ISoapServiceGateway>();
            services.RemoveAll<ICompanyDbReader>();
            services.AddSingleton<ICompanyApiGateway>(CompanyApi);
            services.AddSingleton<ISoapServiceGateway>(Soap);
            services.AddSingleton<ICompanyDbReader>(Db);
        });
    }
}

public sealed class FakeCompanyApiGateway : ICompanyApiGateway
{
    private static readonly JsonNode DefaultBody =
        JsonNode.Parse("""{ "ok": true, "ready": true, "orderNo": "SO-TEST", "status": "CREATED" }""")!;

    public ConcurrentQueue<CompanyApiCall> Calls { get; } = new();

    public Func<CompanyApiCall, CompanyApiResult> Respond { get; set; } = _ =>
        new CompanyApiResult(200, DefaultBody.DeepClone(), DefaultBody.ToJsonString(), new Dictionary<string, string>());

    public void Reset()
    {
        Calls.Clear();
        Respond = _ => new CompanyApiResult(200, DefaultBody.DeepClone(), DefaultBody.ToJsonString(), new Dictionary<string, string>());
    }

    public Task<CompanyApiResult> SendAsync(
        string reference, CompanyApiEndpointOptions target, CompanyApiCall call, CancellationToken ct)
    {
        Calls.Enqueue(call);
        return Task.FromResult(Respond(call));
    }
}

public sealed class FakeSoapServiceGateway : ISoapServiceGateway
{
    public Func<SoapCall, SoapResult> Respond { get; set; } = _ =>
        new SoapResult(200, "<Envelope><Body><result>OK</result></Body></Envelope>");

    public void Reset() => Respond = _ => new SoapResult(200, "<Envelope><Body><result>OK</result></Body></Envelope>");

    public Task<SoapResult> SendAsync(
        string reference, SoapServiceEndpointOptions target, SoapCall call, CancellationToken ct) =>
        Task.FromResult(Respond(call));
}

public sealed class FakeCompanyDbReader : ICompanyDbReader
{
    public Func<string, DbQueryResult> Respond { get; set; } = _ =>
        new DbQueryResult([new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase) { ["ready"] = 1 }]);

    public void Reset() => Respond = _ =>
        new DbQueryResult([new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase) { ["ready"] = 1 }]);

    public Task<DbQueryResult> QueryAsync(
        string reference, CompanyDbOptions target, string sql, IReadOnlyList<object?> parameters, int maxRows, CancellationToken ct) =>
        Task.FromResult(Respond(sql));
}
