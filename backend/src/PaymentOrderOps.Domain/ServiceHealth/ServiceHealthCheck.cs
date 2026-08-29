namespace PaymentOrderOps.Domain.ServiceHealth;

public sealed class ServiceHealthCheck
{
    public const int NameMaxLength = 120;
    public const int UrlMaxLength = 2048;

    private ServiceHealthCheck()
    {
        Name = string.Empty;
        Url = string.Empty;
        NormalizedUrl = string.Empty;
        Headers = new Dictionary<string, string>(StringComparer.Ordinal);
    }

    public ServiceHealthCheck(
        Guid id,
        ServiceEnvironment environment,
        string name,
        ServiceHealthGroup group,
        ServiceHealthHttpMethod method,
        string url,
        IEnumerable<KeyValuePair<string, string>>? headers,
        string? body,
        int expectedStatusCode,
        bool isEnabled,
        ServiceHealthSource source)
    {
        Id = id;
        Environment = environment;
        Source = source;
        Name = name.Trim();
        Group = group;
        Method = method;
        Url = url.Trim();
        NormalizedUrl = NormalizeUrl(Url);
        Headers = ToHeaderMap(headers);
        Body = string.IsNullOrWhiteSpace(body) ? null : body;
        ExpectedStatusCode = expectedStatusCode;
        IsEnabled = isEnabled;
    }

    public Guid Id { get; private set; }

    public ServiceEnvironment Environment { get; private set; }

    public string Name { get; private set; }

    public ServiceHealthGroup Group { get; private set; }

    public ServiceHealthHttpMethod Method { get; private set; }

    public string Url { get; private set; }

    public string NormalizedUrl { get; private set; }

    public Dictionary<string, string> Headers { get; private set; }

    public string? Body { get; private set; }

    public int ExpectedStatusCode { get; private set; }

    public bool IsEnabled { get; private set; }

    public ServiceHealthSource Source { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public uint Xmin { get; private set; }

    public bool IsDeleted { get; private set; }

    public void Update(
        string name,
        ServiceHealthGroup group,
        ServiceHealthHttpMethod method,
        string url,
        IEnumerable<KeyValuePair<string, string>>? headers,
        string? body,
        int expectedStatusCode,
        bool isEnabled)
    {
        Name = name.Trim();
        Group = group;
        Method = method;
        Url = url.Trim();
        NormalizedUrl = NormalizeUrl(Url);
        Headers = ToHeaderMap(headers);
        Body = string.IsNullOrWhiteSpace(body) ? null : body;
        ExpectedStatusCode = expectedStatusCode;
        IsEnabled = isEnabled;
    }

    public void SoftDelete() => IsDeleted = true;

    public static string NormalizeUrl(string url) => url.Trim().TrimEnd('/').ToLowerInvariant();

    private static Dictionary<string, string> ToHeaderMap(IEnumerable<KeyValuePair<string, string>>? headers)
    {
        var map = new Dictionary<string, string>(StringComparer.Ordinal);
        if (headers is null)
        {
            return map;
        }

        foreach (var (key, value) in headers)
        {
            if (!string.IsNullOrWhiteSpace(key))
            {
                map[key] = value;
            }
        }

        return map;
    }
}
