using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace PaymentOrderOps.Infrastructure.Persistence.Configurations;

/// <summary>
/// Shared <c>jsonb</c> serialization for the Test Runs entities: web defaults plus a
/// camelCase string enum converter so the stored blobs stay readable.
/// </summary>
internal static class TestRunsJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },

        // Postgres jsonb does not preserve object key order, so the polymorphic "kind"
        // discriminator can land anywhere in a serialized ScenarioStep.
        AllowOutOfOrderMetadataProperties = true,
    };

    public static string Serialize<T>(T value) => JsonSerializer.Serialize(value, Options);

    public static T? Deserialize<T>(string? json) =>
        string.IsNullOrWhiteSpace(json) ? default : JsonSerializer.Deserialize<T>(json, Options);

    public static ValueComparer<T> Comparer<T>()
        where T : class => new(
        (left, right) => Serialize(left) == Serialize(right),
        value => value == null ? 0 : Serialize(value).GetHashCode(StringComparison.Ordinal),
        value => value == null ? null! : Deserialize<T>(Serialize(value))!);
}
