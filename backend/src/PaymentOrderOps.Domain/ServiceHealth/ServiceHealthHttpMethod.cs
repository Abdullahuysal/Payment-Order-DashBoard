namespace PaymentOrderOps.Domain.ServiceHealth;

public enum ServiceHealthHttpMethod
{
    Get,
    Head,
    Post,
    Put,
    Patch,
    Delete,
}

public static class ServiceHealthHttpMethodExtensions
{
    public static string ToWireValue(this ServiceHealthHttpMethod method) => method switch
    {
        ServiceHealthHttpMethod.Get => "GET",
        ServiceHealthHttpMethod.Head => "HEAD",
        ServiceHealthHttpMethod.Post => "POST",
        ServiceHealthHttpMethod.Put => "PUT",
        ServiceHealthHttpMethod.Patch => "PATCH",
        ServiceHealthHttpMethod.Delete => "DELETE",
        _ => method.ToString().ToUpperInvariant(),
    };

    public static bool TryParse(string? value, out ServiceHealthHttpMethod method)
        => Enum.TryParse(value, ignoreCase: true, out method) && Enum.IsDefined(method);
}
