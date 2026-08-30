using Asp.Versioning.Builder;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Alerts;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Brokers;
using PaymentOrderOps.Api.Features.MessageQueues.V1.DeadLetters;
using PaymentOrderOps.Api.Features.MessageQueues.V1.KafkaConsumerGroups;
using PaymentOrderOps.Api.Features.MessageQueues.V1.KafkaTopics;
using PaymentOrderOps.Api.Features.MessageQueues.V1.RabbitMqQueues;
using PaymentOrderOps.Api.Features.MessageQueues.V1.Scope;
using PaymentOrderOps.Api.Infrastructure;
using PaymentOrderOps.Api.Infrastructure.Endpoints;

namespace PaymentOrderOps.Api.Features.MessageQueues.V1;

public sealed class MessageQueuesV1Module : IEndpointModule
{
    private const string RoutePrefix = "/api/v{version:apiVersion}/message-queues";

    public void MapEndpoints(IEndpointRouteBuilder app, ApiVersionSet versionSet)
    {
        var group = app.MapGroup(RoutePrefix)
            .WithApiVersionSet(versionSet)
            .MapToApiVersion(1)
            .WithTags("Message Queues")
            .WithDescription(
                $"Read-only RabbitMQ and Kafka observability. Every request requires the `{EnvironmentContextEndpointFilter.HeaderName}` " +
                "header (`dev`, `preprod` or `production`); it selects the broker connection for that environment. " +
                "A broker with no configuration answers `503`; a configured broker that cannot be reached answers `502`.")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status502BadGateway)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable)
            .AddEndpointFilter<EnvironmentContextEndpointFilter>();

        ListBrokersEndpoint.Map(group);
        GetBrokerHealthEndpoint.Map(group);

        ListRabbitMqQueuesEndpoint.Map(group);
        GetRabbitMqQueueEndpoint.Map(group);
        PeekRabbitMqMessagesEndpoint.Map(group);

        ListKafkaTopicsEndpoint.Map(group);
        GetKafkaTopicEndpoint.Map(group);
        PeekKafkaMessagesEndpoint.Map(group);

        ListKafkaConsumerGroupsEndpoint.Map(group);
        GetKafkaConsumerGroupEndpoint.Map(group);

        ListDeadLettersEndpoint.Map(group);
        ListQueueAlertsEndpoint.Map(group);

        GetScopeEndpoint.Map(group);
        PutScopeEndpoint.Map(group);
    }
}
