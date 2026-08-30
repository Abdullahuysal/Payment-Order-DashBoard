import { ENVIRONMENT_HEADER } from '@/services/config';
import { apiClient } from '@/services/http';
import type { AppEnvironment } from '@/types';

import type {
  BrokerHealth,
  BrokerKind,
  BrokerStatus,
  DeadLetterOverview,
  KafkaConsumerGroup,
  KafkaConsumerGroupDetail,
  KafkaConsumerGroupParams,
  KafkaMessagePreview,
  KafkaTopic,
  KafkaTopicDetail,
  KafkaTopicParams,
  PagedResponse,
  QueueAlert,
  RabbitMessagePreview,
  RabbitQueue,
  RabbitQueueParams,
} from '../types';

const R = '/api/v1/message-queues';

function headers(env: AppEnvironment): Record<string, string> {
  return { [ENVIRONMENT_HEADER]: env };
}

type QueryValue = string | number | boolean | null | undefined;

function opts(env: AppEnvironment, signal?: AbortSignal, query?: Record<string, QueryValue>) {
  return {
    headers: headers(env),
    ...(signal ? { signal } : {}),
    ...(query ? { query } : {}),
  };
}

const asQuery = (params: object): Record<string, QueryValue> =>
  params as Record<string, QueryValue>;

/** vhost segmenti URL-encoded gönderilir (`/` → `%2F`). */
const seg = (value: string): string => encodeURIComponent(value);

export const queuesApi = {
  brokers(env: AppEnvironment, signal?: AbortSignal): Promise<BrokerStatus[]> {
    return apiClient().get<BrokerStatus[]>(`${R}/brokers`, opts(env, signal));
  },

  brokerHealth(
    env: AppEnvironment,
    broker: BrokerKind,
    signal?: AbortSignal,
  ): Promise<BrokerHealth> {
    return apiClient().get<BrokerHealth>(`${R}/brokers/${broker}/health`, opts(env, signal));
  },
  rabbitQueues(
    env: AppEnvironment,
    params: RabbitQueueParams,
    signal?: AbortSignal,
  ): Promise<PagedResponse<RabbitQueue>> {
    return apiClient().get<PagedResponse<RabbitQueue>>(
      `${R}/rabbitmq/queues`,
      opts(env, signal, asQuery(params)),
    );
  },

  rabbitQueue(
    env: AppEnvironment,
    vhost: string,
    name: string,
    signal?: AbortSignal,
  ): Promise<RabbitQueue> {
    return apiClient().get<RabbitQueue>(
      `${R}/rabbitmq/queues/${seg(vhost)}/${seg(name)}`,
      opts(env, signal),
    );
  },

  rabbitMessages(
    env: AppEnvironment,
    vhost: string,
    name: string,
    count: number,
    signal?: AbortSignal,
  ): Promise<RabbitMessagePreview[]> {
    return apiClient().get<RabbitMessagePreview[]>(
      `${R}/rabbitmq/queues/${seg(vhost)}/${seg(name)}/messages`,
      opts(env, signal, { count }),
    );
  },
  kafkaTopics(
    env: AppEnvironment,
    params: KafkaTopicParams,
    signal?: AbortSignal,
  ): Promise<PagedResponse<KafkaTopic>> {
    return apiClient().get<PagedResponse<KafkaTopic>>(
      `${R}/kafka/topics`,
      opts(env, signal, asQuery(params)),
    );
  },

  kafkaTopic(env: AppEnvironment, name: string, signal?: AbortSignal): Promise<KafkaTopicDetail> {
    return apiClient().get<KafkaTopicDetail>(`${R}/kafka/topics/${seg(name)}`, opts(env, signal));
  },

  kafkaMessages(
    env: AppEnvironment,
    name: string,
    query: { partition?: number | undefined; fromOffset?: number | undefined; count: number },
    signal?: AbortSignal,
  ): Promise<KafkaMessagePreview[]> {
    return apiClient().get<KafkaMessagePreview[]>(
      `${R}/kafka/topics/${seg(name)}/messages`,
      opts(env, signal, asQuery(query)),
    );
  },

  kafkaConsumerGroups(
    env: AppEnvironment,
    params: KafkaConsumerGroupParams,
    signal?: AbortSignal,
  ): Promise<KafkaConsumerGroup[]> {
    return apiClient().get<KafkaConsumerGroup[]>(
      `${R}/kafka/consumer-groups`,
      opts(env, signal, asQuery(params)),
    );
  },

  kafkaConsumerGroup(
    env: AppEnvironment,
    groupId: string,
    signal?: AbortSignal,
  ): Promise<KafkaConsumerGroupDetail> {
    return apiClient().get<KafkaConsumerGroupDetail>(
      `${R}/kafka/consumer-groups/${seg(groupId)}`,
      opts(env, signal),
    );
  },
  deadLetters(env: AppEnvironment, signal?: AbortSignal): Promise<DeadLetterOverview> {
    return apiClient().get<DeadLetterOverview>(`${R}/dead-letters`, opts(env, signal));
  },

  alerts(env: AppEnvironment, signal?: AbortSignal): Promise<QueueAlert[]> {
    return apiClient().get<QueueAlert[]>(`${R}/alerts`, opts(env, signal));
  },
};
