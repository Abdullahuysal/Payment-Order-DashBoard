using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PaymentOrderOps.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceEnvironment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServiceHealthChecks_Group",
                table: "ServiceHealthChecks");

            migrationBuilder.DropIndex(
                name: "IX_ServiceHealthChecks_Method_NormalizedUrl",
                table: "ServiceHealthChecks");

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0000-7000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0000-7000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0000-7000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0000-7000-8000-000000000004"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0000-7000-8000-000000000005"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0000-7000-8000-000000000006"));

            migrationBuilder.AddColumn<string>(
                name: "Environment",
                table: "ServiceHealthChecks",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "Dev");

            migrationBuilder.InsertData(
                table: "ServiceHealthChecks",
                columns: new[] { "Id", "Body", "CreatedAtUtc", "ExpectedStatusCode", "Group", "Headers", "IsEnabled", "Method", "Name", "NormalizedUrl", "Source", "UpdatedAtUtc", "Url" },
                values: new object[,]
                {
                    { new Guid("0198f1a1-0001-7000-8000-000000000001"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Payment", "{}", true, "Get", "Payment Gateway", "https://payment-gateway.boyner.internal/actuator/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://payment-gateway.boyner.internal/actuator/health" },
                    { new Guid("0198f1a1-0001-7000-8000-000000000002"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Payment", "{}", true, "Get", "3DS Service", "https://payment-3ds.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://payment-3ds.boyner.internal/health" },
                    { new Guid("0198f1a1-0001-7000-8000-000000000003"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Payment", "{}", true, "Get", "Wallet Service", "https://wallet.boyner.internal/actuator/health/liveness", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://wallet.boyner.internal/actuator/health/liveness" },
                    { new Guid("0198f1a1-0001-7000-8000-000000000004"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Order", "{}", true, "Get", "Order Orchestrator", "https://order-orchestrator.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://order-orchestrator.boyner.internal/health" },
                    { new Guid("0198f1a1-0001-7000-8000-000000000005"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Order", "{}", true, "Get", "Fulfillment Service", "https://fulfillment.boyner.internal/actuator/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://fulfillment.boyner.internal/actuator/health" },
                    { new Guid("0198f1a1-0001-7000-8000-000000000006"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 200, "Platform", "{}", true, "Get", "Notification Service", "https://notification.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://notification.boyner.internal/health" }
                });

            migrationBuilder.InsertData(
                table: "ServiceHealthChecks",
                columns: new[] { "Id", "Body", "CreatedAtUtc", "Environment", "ExpectedStatusCode", "Group", "Headers", "IsEnabled", "Method", "Name", "NormalizedUrl", "Source", "UpdatedAtUtc", "Url" },
                values: new object[,]
                {
                    { new Guid("0198f1a1-0002-7000-8000-000000000001"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Preprod", 200, "Payment", "{}", true, "Get", "Payment Gateway", "https://payment-gateway.boyner.internal/actuator/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://payment-gateway.boyner.internal/actuator/health" },
                    { new Guid("0198f1a1-0002-7000-8000-000000000002"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Preprod", 200, "Payment", "{}", true, "Get", "3DS Service", "https://payment-3ds.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://payment-3ds.boyner.internal/health" },
                    { new Guid("0198f1a1-0002-7000-8000-000000000003"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Preprod", 200, "Payment", "{}", true, "Get", "Wallet Service", "https://wallet.boyner.internal/actuator/health/liveness", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://wallet.boyner.internal/actuator/health/liveness" },
                    { new Guid("0198f1a1-0002-7000-8000-000000000004"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Preprod", 200, "Order", "{}", true, "Get", "Order Orchestrator", "https://order-orchestrator.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://order-orchestrator.boyner.internal/health" },
                    { new Guid("0198f1a1-0002-7000-8000-000000000005"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Preprod", 200, "Order", "{}", true, "Get", "Fulfillment Service", "https://fulfillment.boyner.internal/actuator/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://fulfillment.boyner.internal/actuator/health" },
                    { new Guid("0198f1a1-0002-7000-8000-000000000006"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Preprod", 200, "Platform", "{}", true, "Get", "Notification Service", "https://notification.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://notification.boyner.internal/health" },
                    { new Guid("0198f1a1-0003-7000-8000-000000000001"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Production", 200, "Payment", "{}", true, "Get", "Payment Gateway", "https://payment-gateway.boyner.internal/actuator/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://payment-gateway.boyner.internal/actuator/health" },
                    { new Guid("0198f1a1-0003-7000-8000-000000000002"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Production", 200, "Payment", "{}", true, "Get", "3DS Service", "https://payment-3ds.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://payment-3ds.boyner.internal/health" },
                    { new Guid("0198f1a1-0003-7000-8000-000000000003"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Production", 200, "Payment", "{}", true, "Get", "Wallet Service", "https://wallet.boyner.internal/actuator/health/liveness", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://wallet.boyner.internal/actuator/health/liveness" },
                    { new Guid("0198f1a1-0003-7000-8000-000000000004"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Production", 200, "Order", "{}", true, "Get", "Order Orchestrator", "https://order-orchestrator.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://order-orchestrator.boyner.internal/health" },
                    { new Guid("0198f1a1-0003-7000-8000-000000000005"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Production", 200, "Order", "{}", true, "Get", "Fulfillment Service", "https://fulfillment.boyner.internal/actuator/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://fulfillment.boyner.internal/actuator/health" },
                    { new Guid("0198f1a1-0003-7000-8000-000000000006"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Production", 200, "Platform", "{}", true, "Get", "Notification Service", "https://notification.boyner.internal/health", "Builtin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://notification.boyner.internal/health" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceHealthChecks_Environment_Group",
                table: "ServiceHealthChecks",
                columns: new[] { "Environment", "Group" });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceHealthChecks_Environment_Method_NormalizedUrl",
                table: "ServiceHealthChecks",
                columns: new[] { "Environment", "Method", "NormalizedUrl" },
                unique: true,
                filter: "\"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServiceHealthChecks_Environment_Group",
                table: "ServiceHealthChecks");

            migrationBuilder.DropIndex(
                name: "IX_ServiceHealthChecks_Environment_Method_NormalizedUrl",
                table: "ServiceHealthChecks");

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0001-7000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0001-7000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0001-7000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0001-7000-8000-000000000004"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0001-7000-8000-000000000005"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0001-7000-8000-000000000006"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0002-7000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0002-7000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0002-7000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0002-7000-8000-000000000004"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0002-7000-8000-000000000005"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0002-7000-8000-000000000006"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0003-7000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0003-7000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0003-7000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0003-7000-8000-000000000004"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0003-7000-8000-000000000005"));

            migrationBuilder.DeleteData(
                table: "ServiceHealthChecks",
                keyColumn: "Id",
                keyValue: new Guid("0198f1a1-0003-7000-8000-000000000006"));

            migrationBuilder.DropColumn(
                name: "Environment",
                table: "ServiceHealthChecks");

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
    }
}
