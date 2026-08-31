namespace PaymentOrderOps.Domain.Todo;

/// <summary>
/// A person who owns todo items. <see cref="NormalizedName"/> backs a case-insensitive unique
/// index so the same name cannot be registered twice.
/// </summary>
public sealed class TodoOwner
{
    public const int NameMaxLength = 120;

    private TodoOwner()
    {
        Name = string.Empty;
        NormalizedName = string.Empty;
    }

    public TodoOwner(Guid id, string name)
    {
        Id = id;
        Name = NormalizeName(name);
        NormalizedName = Name.ToLowerInvariant();
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; }

    public string NormalizedName { get; private set; }

    public static string NormalizeName(string name) =>
        string.Join(' ', name.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    public static string NormalizeKey(string name) => NormalizeName(name).ToLowerInvariant();
}
