using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentOrderOps.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQueueScopeProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QueueScopeProfiles",
                columns: table => new
                {
                    Environment = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false, defaultValue: "Dev"),
                    Patterns = table.Column<string>(type: "jsonb", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QueueScopeProfiles", x => x.Environment);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QueueScopeProfiles");
        }
    }
}
