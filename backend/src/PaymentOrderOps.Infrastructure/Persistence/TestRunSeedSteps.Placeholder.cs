using System.Text.Json.Nodes;
using PaymentOrderOps.Domain.TestRuns;

namespace PaymentOrderOps.Infrastructure.Persistence;

/// <summary>
/// PLACEHOLDER step tables for the seeded scenarios. Every step here is schema-valid but its
/// internals (endpoint refs, queries, assertions) are stubs pointing at not-yet-configured
/// targets. Keys / titles / kinds match the frontend's rendered timeline. QA replaces this
/// whole file when the real step tables land — nothing else in the slice depends on its body.
/// </summary>
internal static class TestRunSeedSteps
{
    public static IReadOnlyList<ScenarioStep> For(string scenarioKey) => scenarioKey switch
    {
        "order-create" =>
        [
            Db("prepare-customer", "Test müşterisi ve sepet hazırlanır"),
            Http("add-to-cart", "Ürün sepete eklenir", "companyApi:orders", "/internal/cart/items"),
            Http("checkout", "Ödeme (mock POS) ile sipariş oluşturulur", "companyApi:orders", "/internal/checkout"),
            Poll("verify-orchestrator", "Order-orchestrator'da siparişin düştüğü doğrulanır", "companyApi:orders", "/internal/orders/status"),
            Extract("extract-result", "Sipariş no ve durum çıktı olarak alınır", "checkout",
                new Dictionary<string, string> { ["orderNo"] = "$.orderNo", ["status"] = "$.status" }),
        ],
        "order-bulk" =>
        [
            Db("prepare-pool", "Müşteri havuzu ve ürün profili hazırlanır"),
            Http("spawn-orders", "N adet sipariş paralel oluşturulur", "companyApi:orders", "/internal/checkout"),
            Extract("collect-results", "Başarılı / başarısız dağılımı toplanır", "spawn-orders",
                new Dictionary<string, string> { ["orderNo"] = "$.orderNo" }),
            Assert("assert-distribution", "Dağılım ve süre eşikleri doğrulanır"),
        ],
        "retail-invoice" =>
        [
            Db("load-order", "Faturalanacak retail siparişi yüklenir"),
            Soap("issue-invoice", "Satış faturası kesme akışı tetiklenir", "soap:invoices"),
            Poll("poll-edocument", "e-Belge durumu beklenir", "companyApi:invoices", "/internal/edocument/status"),
            Assert("assert-invoice", "Fatura no ve e-belge durumu doğrulanır"),
        ],
        "retail-return-invoice" =>
        [
            Db("load-return", "İadesi yapılacak sipariş / kalem yüklenir"),
            Soap("create-return-invoice", "İade faturası oluşturma akışı tetiklenir", "soap:invoices"),
            Assert("reconcile-amount", "İade fatura tutar mutabakatı doğrulanır"),
            Extract("extract-result", "İade fatura no ve tutar çıktı olarak alınır", "create-return-invoice",
                new Dictionary<string, string> { ["returnInvoiceNo"] = "$.returnInvoiceNo" }),
        ],
        "retail-shipment-advance" =>
        [
            Db("read-current-status", "Siparişin mevcut kargo statüsü okunur"),
            Http("advance-status", "Hedef statüye kadar adımlar ilerletilir", "companyApi:shipments", "/internal/shipments/advance"),
            Poll("verify-events", "Her adımda event / webhook tetiklendiği doğrulanır", "companyApi:shipments", "/internal/shipments/events"),
            Assert("assert-webhooks", "Beklenen webhook'lar alındı mı doğrulanır"),
        ],
        "merchant-shipment-advance" =>
        [
            Db("resolve-merchant-order", "3. parti sipariş çözümlenir"),
            Http("advance-merchant-status", "Merchant kargo akışına göre statü ilerletilir", "companyApi:merchant", "/internal/merchant/shipments/advance"),
            Poll("verify-integration", "Merchant entegrasyon adımları doğrulanır", "companyApi:merchant", "/internal/merchant/shipments/events"),
            Assert("assert-merchant-flow", "Retail'den farklı merchant adımları doğrulanır"),
        ],
        _ => [],
    };

    private static DbQueryStep Db(string key, string title) => new()
    {
        Key = key,
        Title = title,
        Query = "SELECT 1 AS ready",
    };

    private static HttpRequestStep Http(string key, string title, string endpoint, string path) => new()
    {
        Key = key,
        Title = title,
        Request = new HttpStepRequest
        {
            Method = "POST",
            Endpoint = endpoint,
            Path = path,
        },
    };

    private static SoapRequestStep Soap(string key, string title, string endpoint) => new()
    {
        Key = key,
        Title = title,
        Request = new SoapStepRequest
        {
            Endpoint = endpoint,
            Body = "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\"><soapenv:Body/></soapenv:Envelope>",
        },
    };

    private static PollStep Poll(string key, string title, string endpoint, string path) => new()
    {
        Key = key,
        Title = title,
        IntervalMs = 1000,
        TimeoutMs = 15000,
        Read = new PollRead
        {
            Http = new HttpStepRequest
            {
                Method = "GET",
                Endpoint = endpoint,
                Path = path,
            },
        },
        Until = new Assertion
        {
            JsonPath = "$.ready",
            Op = AssertionOp.Equals,
            Value = JsonValue.Create(true),
        },
    };

    private static ExtractStep Extract(string key, string title, string from, Dictionary<string, string> map) => new()
    {
        Key = key,
        Title = title,
        From = from,
        Map = map,
    };

    private static AssertStep Assert(string key, string title) => new()
    {
        Key = key,
        Title = title,
        Expect = new Assertion
        {
            JsonPath = "$.ok",
            Op = AssertionOp.Equals,
            Value = JsonValue.Create(true),
        },
    };
}
