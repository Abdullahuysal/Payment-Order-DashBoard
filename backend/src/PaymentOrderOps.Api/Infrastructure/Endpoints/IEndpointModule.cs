using Asp.Versioning.Builder;

namespace PaymentOrderOps.Api.Infrastructure.Endpoints;

/// <summary>
/// A feature slice that contributes routes. Implementations are discovered and invoked
/// once at startup by <see cref="EndpointModuleExtensions.MapFeatureModules"/>, so adding a
/// feature (or a new API version of one) never touches <c>Program.cs</c>.
/// </summary>
public interface IEndpointModule
{
    void MapEndpoints(IEndpointRouteBuilder app, ApiVersionSet versionSet);
}
