using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PaymentOrderOps.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServiceHealthChecks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Group = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Method = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    NormalizedUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    Headers = table.Column<string>(type: "jsonb", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: true),
                    ExpectedStatusCode = table.Column<int>(type: "integer", nullable: false, defaultValue: 200),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Source = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceHealthChecks", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ServiceHealthChecks",
                columns: new[] { "Id", "Body", "CreatedAtUtc", "ExpectedStatusCode", "Group", "Headers", "IsEnabled", "Method", "Name", "NormalizedUrl", "Source", "UpdatedAtUtc", "Url" },
                values: new object[,]
                {
                    { new Guid("0198f1a1-0000-7000-8000-000000000001"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Payment", "{}", true, "Get", "Payment Gateway", "https://payment-gateway.boyner.internal/actuator/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://payment-gateway.boyner.internal/actuator/health" },
                    { new Guid("0198f1a1-0000-7000-8000-000000000002"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Payment", "{}", true, "Get", "3DS Service", "https://payment-3ds.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://payment-3ds.boyner.internal/health" },
                    { new Guid("0198f1a1-0000-7000-8000-000000000003"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Payment", "{}", true, "Get", "Wallet Service", "https://wallet.boyner.internal/actuator/health/liveness", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://wallet.boyner.internal/actuator/health/liveness" },
                    { new Guid("0198f1a1-0000-7000-8000-000000000004"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Order", "{}", true, "Get", "Order Orchestrator", "https://order-orchestrator.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://order-orchestrator.boyner.internal/health" },
                    { new Guid("0198f1a1-0000-7000-8000-000000000005"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Order", "{}", true, "Get", "Fulfillment Service", "https://fulfillment.boyner.internal/actuator/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://fulfillment.boyner.internal/actuator/health" },
                    { new Guid("0198f1a1-0000-7000-8000-000000000006"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Platform", "{}", true, "Get", "Notification Service", "https://notification.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://notification.boyner.internal/health" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceHealthChecks_Group",
                table: "ServiceHealthChecks",
                column: "Group");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceHealthChecks_Method_NormalizedUrl",
                table: "ServiceHealthChecks",
                columns: new[] { "Method", "NormalizedUrl" },
                unique: true,
                filter: "\"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceHealthChecks");
        }
    }
}
