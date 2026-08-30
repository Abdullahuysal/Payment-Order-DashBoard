using System.Text.Json.Nodes;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Infrastructure.Persistence;

/// <summary>
/// Seeds the six built-in scenarios. Keys match the frontend exactly; ids are stable.
/// The <c>inputs</c> shape is taken verbatim from the frontend contract; the step tables come
/// from <see cref="TestRunSeedSteps"/> and are placeholders.
/// </summary>
public static class TestRunSeedData
{
    public static readonly DateTime Timestamp = ServiceHealthSeedData.Timestamp;

    public static readonly IReadOnlyList<ScenarioDefinition> Definitions =
    [
        new(
            Id: Guid.Parse("01991000-0000-7000-8000-000000000001"),
            Key: "order-create",
            Name: "Sipariş Oluşturma",
            Description: "Tek bir siparişi uçtan uca oluşturur ve sistemde düştüğünü doğrular.",
            Kind: TestScenarioKind.Generic,
            SupportsRepeat: false,
            Inputs:
            [
                Select("customerType", "Müşteri", true, "new",
                    ("new", "Yeni test müşterisi"), ("existing", "Var olan müşteri")),
                Text("customerId", "Müşteri no", false, placeholder: "1002453",
                    help: "Yalnızca “Var olan müşteri” seçildiğinde kullanılır."),
                Text("productSku", "Ürün SKU", true, placeholder: "BOY-1234567"),
                Number("quantity", "Adet", true, defaultValue: 1),
                Select("paymentMethod", "Ödeme yöntemi", true, "creditCard",
                    ("creditCard", "Kredi kartı (mock POS)"), ("wallet", "Cüzdan"), ("transfer", "Havale")),
                Text("couponCode", "Kupon kodu", false),
                Text("note", "Not", false),
            ]),
        new(
            Id: Guid.Parse("01991000-0000-7000-8000-000000000002"),
            Key: "order-bulk",
            Name: "Toplu Sipariş Oluşturma",
            Description: "Aynı anda çok sayıda sipariş üretir (yük / kapsam testi).",
            Kind: TestScenarioKind.Generic,
            SupportsRepeat: true,
            Inputs:
            [
                Text("productSku", "Ürün SKU", true, placeholder: "BOY-1234567"),
                Number("quantityPerOrder", "Sipariş başına adet", true, defaultValue: 1),
                Select("customerPool", "Müşteri havuzu", true, "shared",
                    ("shared", "Tek müşteri (paylaşımlı)"), ("unique", "Her sipariş için ayrı müşteri")),
                Select("paymentMethod", "Ödeme yöntemi", true, "creditCard",
                    ("creditCard", "Kredi kartı (mock POS)"), ("wallet", "Cüzdan")),
            ]),
        new(
            Id: Guid.Parse("01991000-0000-7000-8000-000000000003"),
            Key: "retail-invoice",
            Name: "Retail Fatura Oluşturma",
            Description: "Boyner (retail) ürünleri için satış faturası kesme akışı.",
            Kind: TestScenarioKind.Retail,
            SupportsRepeat: false,
            Inputs:
            [
                Text("orderNo", "Sipariş no", true, placeholder: "SO-40011234"),
                Select("invoiceType", "Fatura tipi", true, "sales", ("sales", "Satış faturası")),
                Bool("sendEDocument", "e-Belge gönderilsin", false, defaultValue: true),
            ]),
        new(
            Id: Guid.Parse("01991000-0000-7000-8000-000000000004"),
            Key: "retail-return-invoice",
            Name: "Retail İade Faturası Oluşturma",
            Description: "Boyner (retail) ürünleri için iade faturası oluşturma akışı.",
            Kind: TestScenarioKind.Retail,
            SupportsRepeat: false,
            Inputs:
            [
                Text("orderNo", "Sipariş no", true, placeholder: "SO-40011234"),
                Text("returnItems", "İade kalemleri", true, placeholder: "BOY-1234567:1, BOY-7654321:2",
                    help: "SKU:adet çiftleri, virgülle ayrılır."),
                Select("reason", "İade nedeni", true, "customer",
                    ("customer", "Müşteri vazgeçti"), ("defect", "Ürün kusurlu"), ("wrongItem", "Yanlış ürün")),
            ]),
        new(
            Id: Guid.Parse("01991000-0000-7000-8000-000000000005"),
            Key: "retail-shipment-advance",
            Name: "Retail Kargo Statüsü İlerletme",
            Description: "Retail siparişin kargo statüsünü hedef adıma kadar ilerletir.",
            Kind: TestScenarioKind.Retail,
            SupportsRepeat: false,
            Inputs:
            [
                Text("orderNo", "Sipariş no", true, placeholder: "SO-40011234"),
                Select("targetStatus", "Hedef statü", true, "shipped",
                    ("prepared", "Hazırlandı"), ("shipped", "Kargoya verildi"),
                    ("inTransit", "Yolda"), ("delivered", "Teslim edildi")),
                Bool("emitWebhooks", "Webhook'lar tetiklensin", false, defaultValue: true),
            ]),
        new(
            Id: Guid.Parse("01991000-0000-7000-8000-000000000006"),
            Key: "merchant-shipment-advance",
            Name: "Merchant Kargo Statüsü İlerletme",
            Description: "3. parti (merchant) satıcı siparişinin kargo statüsünü ilerletir.",
            Kind: TestScenarioKind.Merchant,
            SupportsRepeat: false,
            Inputs:
            [
                Text("merchantOrderNo", "Merchant sipariş no", true),
                Text("merchantId", "Merchant no", true),
                Select("targetStatus", "Hedef statü", true, "shipped",
                    ("approved", "Onaylandı"), ("shipped", "Kargoya verildi"), ("delivered", "Teslim edildi")),
                Secret("merchantApiToken", "Merchant API token", false,
                    help: "Boş bırakılırsa ortamın varsayılan servis token’ı kullanılır."),
            ]),
    ];

    public static IEnumerable<object> BuildScenarioRows()
    {
        foreach (var definition in Definitions)
        {
            yield return new
            {
                definition.Id,
                definition.Key,
                definition.Name,
                definition.Description,
                definition.Kind,
                definition.SupportsRepeat,
                Inputs = definition.Inputs.ToList(),
                Steps = TestRunSeedSteps.For(definition.Key).ToList(),
                CreatedAtUtc = Timestamp,
                UpdatedAtUtc = Timestamp,
            };
        }
    }

    private static InputField Text(string name, string label, bool required, string? placeholder = null, string? help = null) =>
        new()
        {
            Name = name,
            Label = label,
            Type = InputFieldType.String,
            Required = required,
            Placeholder = placeholder,
            Help = help,
        };

    private static InputField Number(string name, string label, bool required, double? defaultValue = null) =>
        new()
        {
            Name = name,
            Label = label,
            Type = InputFieldType.Number,
            Required = required,
            DefaultValue = defaultValue is null ? null : JsonValue.Create(defaultValue.Value),
        };

    private static InputField Bool(string name, string label, bool required, bool defaultValue) =>
        new()
        {
            Name = name,
            Label = label,
            Type = InputFieldType.Boolean,
            Required = required,
            DefaultValue = JsonValue.Create(defaultValue),
        };

    private static InputField Secret(string name, string label, bool required, string? help = null) =>
        new()
        {
            Name = name,
            Label = label,
            Type = InputFieldType.Secret,
            Required = required,
            Help = help,
        };

    private static InputField Select(
        string name, string label, bool required, string? defaultValue, params (string Value, string Label)[] options) =>
        new()
        {
            Name = name,
            Label = label,
            Type = InputFieldType.Select,
            Required = required,
            Options = [.. options.Select(o => new InputOption(o.Value, o.Label))],
            DefaultValue = defaultValue is null ? null : JsonValue.Create(defaultValue),
        };

    public sealed record ScenarioDefinition(
        Guid Id,
        string Key,
        string Name,
        string Description,
        TestScenarioKind Kind,
        bool SupportsRepeat,
        IReadOnlyList<InputField> Inputs);
}
