using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PaymentOrderOps.Infrastructure.Messaging.Kafka;
using PaymentOrderOps.Infrastructure.Messaging.RabbitMq;

namespace PaymentOrderOps.Infrastructure.Messaging;

public static class MessagingModule
{
    public static IServiceCollection AddMessageBrokers(this IServiceCollection services, IConfiguration configuration)
    {
        var options = new MessageBrokersOptions();
        foreach (var environmentSection in configuration.GetSection(MessageBrokersOptions.SectionName).GetChildren())
        {
            options.Environments[environmentSection.Key] = new BrokerEnvironmentOptions
            {
                RabbitMq = environmentSection.GetSection("RabbitMq").Get<RabbitMqOptions>(),
                Kafka = environmentSection.GetSection("Kafka").Get<KafkaOptions>(),
            };
        }

        services.AddSingleton(options);
        services.AddSingleton<IRabbitMqManagementClient, RabbitMqManagementClient>();
        services.AddSingleton<IKafkaAdminGateway, KafkaAdminGateway>();
        return services;
    }
}
