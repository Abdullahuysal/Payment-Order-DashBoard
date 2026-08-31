using Asp.Versioning.Builder;
using PaymentOrderOps.Api.Features.Todo.V1.CreateItem;
using PaymentOrderOps.Api.Features.Todo.V1.CreateOwner;
using PaymentOrderOps.Api.Features.Todo.V1.DeleteItem;
using PaymentOrderOps.Api.Features.Todo.V1.ListItems;
using PaymentOrderOps.Api.Features.Todo.V1.ListOwners;
using PaymentOrderOps.Api.Features.Todo.V1.UpdateItem;
using PaymentOrderOps.Api.Infrastructure.Endpoints;

namespace PaymentOrderOps.Api.Features.Todo.V1;

public sealed class TodoV1Module : IEndpointModule
{
    private const string RoutePrefix = "/api/v{version:apiVersion}/todo";

    public void MapEndpoints(IEndpointRouteBuilder app, ApiVersionSet versionSet)
    {
        var group = app.MapGroup(RoutePrefix)
            .WithApiVersionSet(versionSet)
            .MapToApiVersion(1)
            .WithTags("Todo")
            .WithDescription(
                "Team-wide todo list: owners and their items. Global (no environment scoping, no X-Environment header).")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        ListOwnersEndpoint.Map(group);
        CreateOwnerEndpoint.Map(group);
        ListItemsEndpoint.Map(group);
        CreateItemEndpoint.Map(group);
        UpdateItemEndpoint.Map(group);
        DeleteItemEndpoint.Map(group);
    }
}
