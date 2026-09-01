using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentOrderOps.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLogsAiAndSavedQueries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LogAiSummaries",
                columns: table => new
                {
                    Environment = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false, defaultValue: "Dev"),
                    WindowStartUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WindowEndUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FiltersHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Payload = table.Column<string>(type: "jsonb", nullable: false),
                    Model = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    GroupCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogAiSummaries", x => new { x.Environment, x.WindowStartUtc, x.WindowEndUtc, x.FiltersHash });
                });

            migrationBuilder.CreateTable(
                name: "LogSavedQueries",
                columns: table => new
                {
                    Environment = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false, defaultValue: "Dev"),
                    Queries = table.Column<string>(type: "jsonb", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogSavedQueries", x => x.Environment);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LogAiSummaries");

            migrationBuilder.DropTable(
                name: "LogSavedQueries");
        }
    }
}
