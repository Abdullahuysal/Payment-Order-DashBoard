using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PaymentOrderOps.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTestRuns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TestRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ScenarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScenarioKey = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ProfileId = table.Column<Guid>(type: "uuid", nullable: true),
                    Environment = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false, defaultValue: "Dev"),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    TriggeredBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    RunParams = table.Column<string>(type: "jsonb", nullable: false),
                    Variables = table.Column<string>(type: "jsonb", nullable: false),
                    Summary = table.Column<string>(type: "jsonb", nullable: true),
                    ParentRunId = table.Column<Guid>(type: "uuid", nullable: true),
                    RepeatCount = table.Column<int>(type: "integer", nullable: true),
                    RepeatConcurrency = table.Column<int>(type: "integer", nullable: true),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FinishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Error = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestRuns_TestRuns_ParentRunId",
                        column: x => x.ParentRunId,
                        principalTable: "TestRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TestScenarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    Kind = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Inputs = table.Column<string>(type: "jsonb", nullable: false),
                    Steps = table.Column<string>(type: "jsonb", nullable: false),
                    SupportsRepeat = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestScenarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TestRunSteps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TestRunId = table.Column<Guid>(type: "uuid", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    Key = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Kind = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    RequestJson = table.Column<string>(type: "jsonb", nullable: true),
                    ResponseJson = table.Column<string>(type: "jsonb", nullable: true),
                    DurationMs = table.Column<long>(type: "bigint", nullable: true),
                    Attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Error = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FinishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestRunSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestRunSteps_TestRuns_TestRunId",
                        column: x => x.TestRunId,
                        principalTable: "TestRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ScenarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false, defaultValue: "Dev"),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    NormalizedName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Values = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScenarioProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScenarioProfiles_TestScenarios_ScenarioId",
                        column: x => x.ScenarioId,
                        principalTable: "TestScenarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "TestScenarios",
                columns: new[] { "Id", "CreatedAtUtc", "Description", "Inputs", "Key", "Kind", "Name", "Steps", "UpdatedAtUtc" },
                values: new object[] { new Guid("01991000-0000-7000-8000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tek bir siparişi uçtan uca oluşturur ve sistemde düştüğünü doğrular.", "[{\"name\":\"customerType\",\"label\":\"M\\u00FC\\u015Fteri\",\"type\":\"select\",\"required\":true,\"options\":[{\"value\":\"new\",\"label\":\"Yeni test m\\u00FC\\u015Fterisi\"},{\"value\":\"existing\",\"label\":\"Var olan m\\u00FC\\u015Fteri\"}],\"placeholder\":null,\"help\":null,\"defaultValue\":\"new\"},{\"name\":\"customerId\",\"label\":\"M\\u00FC\\u015Fteri no\",\"type\":\"string\",\"required\":false,\"options\":null,\"placeholder\":\"1002453\",\"help\":\"Yaln\\u0131zca \\u201CVar olan m\\u00FC\\u015Fteri\\u201D se\\u00E7ildi\\u011Finde kullan\\u0131l\\u0131r.\",\"defaultValue\":null},{\"name\":\"productSku\",\"label\":\"\\u00DCr\\u00FCn SKU\",\"type\":\"string\",\"required\":true,\"options\":null,\"placeholder\":\"BOY-1234567\",\"help\":null,\"defaultValue\":null},{\"name\":\"quantity\",\"label\":\"Adet\",\"type\":\"number\",\"required\":true,\"options\":null,\"placeholder\":null,\"help\":null,\"defaultValue\":1},{\"name\":\"paymentMethod\",\"label\":\"\\u00D6deme y\\u00F6ntemi\",\"type\":\"select\",\"required\":true,\"options\":[{\"value\":\"creditCard\",\"label\":\"Kredi kart\\u0131 (mock POS)\"},{\"value\":\"wallet\",\"label\":\"C\\u00FCzdan\"},{\"value\":\"transfer\",\"label\":\"Havale\"}],\"placeholder\":null,\"help\":null,\"defaultValue\":\"creditCard\"},{\"name\":\"couponCode\",\"label\":\"Kupon kodu\",\"type\":\"string\",\"required\":false,\"options\":null,\"placeholder\":null,\"help\":null,\"defaultValue\":null},{\"name\":\"note\",\"label\":\"Not\",\"type\":\"string\",\"required\":false,\"options\":null,\"placeholder\":null,\"help\":null,\"defaultValue\":null}]", "order-create", "Generic", "Sipariş Oluşturma", "[{\"kind\":\"dbQuery\",\"query\":\"SELECT 1 AS ready\",\"key\":\"prepare-customer\",\"title\":\"Test m\\u00FC\\u015Fterisi ve sepet haz\\u0131rlan\\u0131r\",\"extract\":null,\"expect\":null},{\"kind\":\"httpRequest\",\"request\":{\"method\":\"POST\",\"endpoint\":\"companyApi:orders\",\"path\":\"/internal/cart/items\",\"query\":null,\"headers\":null,\"body\":null},\"key\":\"add-to-cart\",\"title\":\"\\u00DCr\\u00FCn sepete eklenir\",\"extract\":null,\"expect\":null},{\"kind\":\"httpRequest\",\"request\":{\"method\":\"POST\",\"endpoint\":\"companyApi:orders\",\"path\":\"/internal/checkout\",\"query\":null,\"headers\":null,\"body\":null},\"key\":\"checkout\",\"title\":\"\\u00D6deme (mock POS) ile sipari\\u015F olu\\u015Fturulur\",\"extract\":null,\"expect\":null},{\"kind\":\"poll\",\"read\":{\"http\":{\"method\":\"GET\",\"endpoint\":\"companyApi:orders\",\"path\":\"/internal/orders/status\",\"query\":null,\"headers\":null,\"body\":null},\"soap\":null},\"until\":{\"path\":null,\"jsonPath\":\"$.ready\",\"xpath\":null,\"column\":null,\"op\":\"equals\",\"value\":true},\"intervalMs\":1000,\"timeoutMs\":15000,\"key\":\"verify-orchestrator\",\"title\":\"Order-orchestrator\\u0027da sipari\\u015Fin d\\u00FC\\u015Ft\\u00FC\\u011F\\u00FC do\\u011Frulan\\u0131r\",\"extract\":null,\"expect\":null},{\"kind\":\"extract\",\"from\":\"checkout\",\"map\":{\"orderNo\":\"$.orderNo\",\"status\":\"$.status\"},\"key\":\"extract-result\",\"title\":\"Sipari\\u015F no ve durum \\u00E7\\u0131kt\\u0131 olarak al\\u0131n\\u0131r\",\"extract\":null,\"expect\":null}]", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.InsertData(
                table: "TestScenarios",
                columns: new[] { "Id", "CreatedAtUtc", "Description", "Inputs", "Key", "Kind", "Name", "Steps", "SupportsRepeat", "UpdatedAtUtc" },
                values: new object[] { new Guid("01991000-0000-7000-8000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Aynı anda çok sayıda sipariş üretir (yük / kapsam testi).", "[{\"name\":\"productSku\",\"label\":\"\\u00DCr\\u00FCn SKU\",\"type\":\"string\",\"required\":true,\"options\":null,\"placeholder\":\"BOY-1234567\",\"help\":null,\"defaultValue\":null},{\"name\":\"quantityPerOrder\",\"label\":\"Sipari\\u015F ba\\u015F\\u0131na adet\",\"type\":\"number\",\"required\":true,\"options\":null,\"placeholder\":null,\"help\":null,\"defaultValue\":1},{\"name\":\"customerPool\",\"label\":\"M\\u00FC\\u015Fteri havuzu\",\"type\":\"select\",\"required\":true,\"options\":[{\"value\":\"shared\",\"label\":\"Tek m\\u00FC\\u015Fteri (payla\\u015F\\u0131ml\\u0131)\"},{\"value\":\"unique\",\"label\":\"Her sipari\\u015F i\\u00E7in ayr\\u0131 m\\u00FC\\u015Fteri\"}],\"placeholder\":null,\"help\":null,\"defaultValue\":\"shared\"},{\"name\":\"paymentMethod\",\"label\":\"\\u00D6deme y\\u00F6ntemi\",\"type\":\"select\",\"required\":true,\"options\":[{\"value\":\"creditCard\",\"label\":\"Kredi kart\\u0131 (mock POS)\"},{\"value\":\"wallet\",\"label\":\"C\\u00FCzdan\"}],\"placeholder\":null,\"help\":null,\"defaultValue\":\"creditCard\"}]", "order-bulk", "Generic", "Toplu Sipariş Oluşturma", "[{\"kind\":\"dbQuery\",\"query\":\"SELECT 1 AS ready\",\"key\":\"prepare-pool\",\"title\":\"M\\u00FC\\u015Fteri havuzu ve \\u00FCr\\u00FCn profili haz\\u0131rlan\\u0131r\",\"extract\":null,\"expect\":null},{\"kind\":\"httpRequest\",\"request\":{\"method\":\"POST\",\"endpoint\":\"companyApi:orders\",\"path\":\"/internal/checkout\",\"query\":null,\"headers\":null,\"body\":null},\"key\":\"spawn-orders\",\"title\":\"N adet sipari\\u015F paralel olu\\u015Fturulur\",\"extract\":null,\"expect\":null},{\"kind\":\"extract\",\"from\":\"spawn-orders\",\"map\":{\"orderNo\":\"$.orderNo\"},\"key\":\"collect-results\",\"title\":\"Ba\\u015Far\\u0131l\\u0131 / ba\\u015Far\\u0131s\\u0131z da\\u011F\\u0131l\\u0131m\\u0131 toplan\\u0131r\",\"extract\":null,\"expect\":null},{\"kind\":\"assert\",\"key\":\"assert-distribution\",\"title\":\"Da\\u011F\\u0131l\\u0131m ve s\\u00FCre e\\u015Fikleri do\\u011Frulan\\u0131r\",\"extract\":null,\"expect\":{\"path\":null,\"jsonPath\":\"$.ok\",\"xpath\":null,\"column\":null,\"op\":\"equals\",\"value\":true}}]", true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.InsertData(
                table: "TestScenarios",
                columns: new[] { "Id", "CreatedAtUtc", "Description", "Inputs", "Key", "Kind", "Name", "Steps", "UpdatedAtUtc" },
                values: new object[,]
                {
                    { new Guid("01991000-0000-7000-8000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Boyner (retail) ürünleri için satış faturası kesme akışı.", "[{\"name\":\"orderNo\",\"label\":\"Sipari\\u015F no\",\"type\":\"string\",\"required\":true,\"options\":null,\"placeholder\":\"SO-40011234\",\"help\":null,\"defaultValue\":null},{\"name\":\"invoiceType\",\"label\":\"Fatura tipi\",\"type\":\"select\",\"required\":true,\"options\":[{\"value\":\"sales\",\"label\":\"Sat\\u0131\\u015F faturas\\u0131\"}],\"placeholder\":null,\"help\":null,\"defaultValue\":\"sales\"},{\"name\":\"sendEDocument\",\"label\":\"e-Belge g\\u00F6nderilsin\",\"type\":\"boolean\",\"required\":false,\"options\":null,\"placeholder\":null,\"help\":null,\"defaultValue\":true}]", "retail-invoice", "Retail", "Retail Fatura Oluşturma", "[{\"kind\":\"dbQuery\",\"query\":\"SELECT 1 AS ready\",\"key\":\"load-order\",\"title\":\"Faturalanacak retail sipari\\u015Fi y\\u00FCklenir\",\"extract\":null,\"expect\":null},{\"kind\":\"soapRequest\",\"request\":{\"endpoint\":\"soap:invoices\",\"soapAction\":null,\"body\":\"\\u003Csoapenv:Envelope xmlns:soapenv=\\u0022http://schemas.xmlsoap.org/soap/envelope/\\u0022\\u003E\\u003Csoapenv:Body/\\u003E\\u003C/soapenv:Envelope\\u003E\"},\"key\":\"issue-invoice\",\"title\":\"Sat\\u0131\\u015F faturas\\u0131 kesme ak\\u0131\\u015F\\u0131 tetiklenir\",\"extract\":null,\"expect\":null},{\"kind\":\"poll\",\"read\":{\"http\":{\"method\":\"GET\",\"endpoint\":\"companyApi:invoices\",\"path\":\"/internal/edocument/status\",\"query\":null,\"headers\":null,\"body\":null},\"soap\":null},\"until\":{\"path\":null,\"jsonPath\":\"$.ready\",\"xpath\":null,\"column\":null,\"op\":\"equals\",\"value\":true},\"intervalMs\":1000,\"timeoutMs\":15000,\"key\":\"poll-edocument\",\"title\":\"e-Belge durumu beklenir\",\"extract\":null,\"expect\":null},{\"kind\":\"assert\",\"key\":\"assert-invoice\",\"title\":\"Fatura no ve e-belge durumu do\\u011Frulan\\u0131r\",\"extract\":null,\"expect\":{\"path\":null,\"jsonPath\":\"$.ok\",\"xpath\":null,\"column\":null,\"op\":\"equals\",\"value\":true}}]", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("01991000-0000-7000-8000-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Boyner (retail) ürünleri için iade faturası oluşturma akışı.", "[{\"name\":\"orderNo\",\"label\":\"Sipari\\u015F no\",\"type\":\"string\",\"required\":true,\"options\":null,\"placeholder\":\"SO-40011234\",\"help\":null,\"defaultValue\":null},{\"name\":\"returnItems\",\"label\":\"\\u0130ade kalemleri\",\"type\":\"string\",\"required\":true,\"options\":null,\"placeholder\":\"BOY-1234567:1, BOY-7654321:2\",\"help\":\"SKU:adet \\u00E7iftleri, virg\\u00FClle ayr\\u0131l\\u0131r.\",\"defaultValue\":null},{\"name\":\"reason\",\"label\":\"\\u0130ade nedeni\",\"type\":\"select\",\"required\":true,\"options\":[{\"value\":\"customer\",\"label\":\"M\\u00FC\\u015Fteri vazge\\u00E7ti\"},{\"value\":\"defect\",\"label\":\"\\u00DCr\\u00FCn kusurlu\"},{\"value\":\"wrongItem\",\"label\":\"Yanl\\u0131\\u015F \\u00FCr\\u00FCn\"}],\"placeholder\":null,\"help\":null,\"defaultValue\":\"customer\"}]", "retail-return-invoice", "Retail", "Retail İade Faturası Oluşturma", "[{\"kind\":\"dbQuery\",\"query\":\"SELECT 1 AS ready\",\"key\":\"load-return\",\"title\":\"\\u0130adesi yap\\u0131lacak sipari\\u015F / kalem y\\u00FCklenir\",\"extract\":null,\"expect\":null},{\"kind\":\"soapRequest\",\"request\":{\"endpoint\":\"soap:invoices\",\"soapAction\":null,\"body\":\"\\u003Csoapenv:Envelope xmlns:soapenv=\\u0022http://schemas.xmlsoap.org/soap/envelope/\\u0022\\u003E\\u003Csoapenv:Body/\\u003E\\u003C/soapenv:Envelope\\u003E\"},\"key\":\"create-return-invoice\",\"title\":\"\\u0130ade faturas\\u0131 olu\\u015Fturma ak\\u0131\\u015F\\u0131 tetiklenir\",\"extract\":null,\"expect\":null},{\"kind\":\"assert\",\"key\":\"reconcile-amount\",\"title\":\"\\u0130ade fatura tutar mutabakat\\u0131 do\\u011Frulan\\u0131r\",\"extract\":null,\"expect\":{\"path\":null,\"jsonPath\":\"$.ok\",\"xpath\":null,\"column\":null,\"op\":\"equals\",\"value\":true}},{\"kind\":\"extract\",\"from\":\"create-return-invoice\",\"map\":{\"returnInvoiceNo\":\"$.returnInvoiceNo\"},\"key\":\"extract-result\",\"title\":\"\\u0130ade fatura no ve tutar \\u00E7\\u0131kt\\u0131 olarak al\\u0131n\\u0131r\",\"extract\":null,\"expect\":null}]", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("01991000-0000-7000-8000-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Retail siparişin kargo statüsünü hedef adıma kadar ilerletir.", "[{\"name\":\"orderNo\",\"label\":\"Sipari\\u015F no\",\"type\":\"string\",\"required\":true,\"options\":null,\"placeholder\":\"SO-40011234\",\"help\":null,\"defaultValue\":null},{\"name\":\"targetStatus\",\"label\":\"Hedef stat\\u00FC\",\"type\":\"select\",\"required\":true,\"options\":[{\"value\":\"prepared\",\"label\":\"Haz\\u0131rland\\u0131\"},{\"value\":\"shipped\",\"label\":\"Kargoya verildi\"},{\"value\":\"inTransit\",\"label\":\"Yolda\"},{\"value\":\"delivered\",\"label\":\"Teslim edildi\"}],\"placeholder\":null,\"help\":null,\"defaultValue\":\"shipped\"},{\"name\":\"emitWebhooks\",\"label\":\"Webhook\\u0027lar tetiklensin\",\"type\":\"boolean\",\"required\":false,\"options\":null,\"placeholder\":null,\"help\":null,\"defaultValue\":true}]", "retail-shipment-advance", "Retail", "Retail Kargo Statüsü İlerletme", "[{\"kind\":\"dbQuery\",\"query\":\"SELECT 1 AS ready\",\"key\":\"read-current-status\",\"title\":\"Sipari\\u015Fin mevcut kargo stat\\u00FCs\\u00FC okunur\",\"extract\":null,\"expect\":null},{\"kind\":\"httpRequest\",\"request\":{\"method\":\"POST\",\"endpoint\":\"companyApi:shipments\",\"path\":\"/internal/shipments/advance\",\"query\":null,\"headers\":null,\"body\":null},\"key\":\"advance-status\",\"title\":\"Hedef stat\\u00FCye kadar ad\\u0131mlar ilerletilir\",\"extract\":null,\"expect\":null},{\"kind\":\"poll\",\"read\":{\"http\":{\"method\":\"GET\",\"endpoint\":\"companyApi:shipments\",\"path\":\"/internal/shipments/events\",\"query\":null,\"headers\":null,\"body\":null},\"soap\":null},\"until\":{\"path\":null,\"jsonPath\":\"$.ready\",\"xpath\":null,\"column\":null,\"op\":\"equals\",\"value\":true},\"intervalMs\":1000,\"timeoutMs\":15000,\"key\":\"verify-events\",\"title\":\"Her ad\\u0131mda event / webhook tetiklendi\\u011Fi do\\u011Frulan\\u0131r\",\"extract\":null,\"expect\":null},{\"kind\":\"assert\",\"key\":\"assert-webhooks\",\"title\":\"Beklenen webhook\\u0027lar al\\u0131nd\\u0131 m\\u0131 do\\u011Frulan\\u0131r\",\"extract\":null,\"expect\":{\"path\":null,\"jsonPath\":\"$.ok\",\"xpath\":null,\"column\":null,\"op\":\"equals\",\"value\":true}}]", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("01991000-0000-7000-8000-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "3. parti (merchant) satıcı siparişinin kargo statüsünü ilerletir.", "[{\"name\":\"merchantOrderNo\",\"label\":\"Merchant sipari\\u015F no\",\"type\":\"string\",\"required\":true,\"options\":null,\"placeholder\":null,\"help\":null,\"defaultValue\":null},{\"name\":\"merchantId\",\"label\":\"Merchant no\",\"type\":\"string\",\"required\":true,\"options\":null,\"placeholder\":null,\"help\":null,\"defaultValue\":null},{\"name\":\"targetStatus\",\"label\":\"Hedef stat\\u00FC\",\"type\":\"select\",\"required\":true,\"options\":[{\"value\":\"approved\",\"label\":\"Onayland\\u0131\"},{\"value\":\"shipped\",\"label\":\"Kargoya verildi\"},{\"value\":\"delivered\",\"label\":\"Teslim edildi\"}],\"placeholder\":null,\"help\":null,\"defaultValue\":\"shipped\"},{\"name\":\"merchantApiToken\",\"label\":\"Merchant API token\",\"type\":\"secret\",\"required\":false,\"options\":null,\"placeholder\":null,\"help\":\"Bo\\u015F b\\u0131rak\\u0131l\\u0131rsa ortam\\u0131n varsay\\u0131lan servis token\\u2019\\u0131 kullan\\u0131l\\u0131r.\",\"defaultValue\":null}]", "merchant-shipment-advance", "Merchant", "Merchant Kargo Statüsü İlerletme", "[{\"kind\":\"dbQuery\",\"query\":\"SELECT 1 AS ready\",\"key\":\"resolve-merchant-order\",\"title\":\"3. parti sipari\\u015F \\u00E7\\u00F6z\\u00FCmlenir\",\"extract\":null,\"expect\":null},{\"kind\":\"httpRequest\",\"request\":{\"method\":\"POST\",\"endpoint\":\"companyApi:merchant\",\"path\":\"/internal/merchant/shipments/advance\",\"query\":null,\"headers\":null,\"body\":null},\"key\":\"advance-merchant-status\",\"title\":\"Merchant kargo ak\\u0131\\u015F\\u0131na g\\u00F6re stat\\u00FC ilerletilir\",\"extract\":null,\"expect\":null},{\"kind\":\"poll\",\"read\":{\"http\":{\"method\":\"GET\",\"endpoint\":\"companyApi:merchant\",\"path\":\"/internal/merchant/shipments/events\",\"query\":null,\"headers\":null,\"body\":null},\"soap\":null},\"until\":{\"path\":null,\"jsonPath\":\"$.ready\",\"xpath\":null,\"column\":null,\"op\":\"equals\",\"value\":true},\"intervalMs\":1000,\"timeoutMs\":15000,\"key\":\"verify-integration\",\"title\":\"Merchant entegrasyon ad\\u0131mlar\\u0131 do\\u011Frulan\\u0131r\",\"extract\":null,\"expect\":null},{\"kind\":\"assert\",\"key\":\"assert-merchant-flow\",\"title\":\"Retail\\u0027den farkl\\u0131 merchant ad\\u0131mlar\\u0131 do\\u011Frulan\\u0131r\",\"extract\":null,\"expect\":{\"path\":null,\"jsonPath\":\"$.ok\",\"xpath\":null,\"column\":null,\"op\":\"equals\",\"value\":true}}]", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioProfiles_ScenarioId_Environment_NormalizedName",
                table: "ScenarioProfiles",
                columns: new[] { "ScenarioId", "Environment", "NormalizedName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TestRunSteps_TestRunId_Order",
                table: "TestRunSteps",
                columns: new[] { "TestRunId", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_TestRuns_CreatedAtUtc",
                table: "TestRuns",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_TestRuns_Environment_Status",
                table: "TestRuns",
                columns: new[] { "Environment", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_TestRuns_ParentRunId",
                table: "TestRuns",
                column: "ParentRunId");

            migrationBuilder.CreateIndex(
                name: "IX_TestRuns_ScenarioId",
                table: "TestRuns",
                column: "ScenarioId");

            migrationBuilder.CreateIndex(
                name: "IX_TestScenarios_Key",
                table: "TestScenarios",
                column: "Key",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScenarioProfiles");

            migrationBuilder.DropTable(
                name: "TestRunSteps");

            migrationBuilder.DropTable(
                name: "TestScenarios");

            migrationBuilder.DropTable(
                name: "TestRuns");
        }
    }
}
