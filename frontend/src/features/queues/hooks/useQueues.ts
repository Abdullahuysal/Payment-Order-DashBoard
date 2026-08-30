import { createContext, useContext } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useAppStore } from '@/app/store';
import type { AppEnvironment } from '@/types';

import { queuesApi } from '../api/queues.api';
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

/** Sayfa genelindeki otomatik yenileme aralığı (ms) veya kapalıysa `false`. */
export const RefreshContext = createContext<number | false>(false);
export const useRefreshInterval = () => useContext(RefreshContext);

export const queueKeys = {
  all: ['message-queues'] as const,
  brokers: (env: string) => ['message-queues', 'brokers', env] as const,
  brokerHealth: (env: string, broker: string) =>
    ['message-queues', 'broker-health', env, broker] as const,
  alerts: (env: string) => ['message-queues', 'alerts', env] as const,
  deadLetters: (env: string) => ['message-queues', 'dead-letters', env] as const,
  rabbitQueues: (env: string, params: RabbitQueueParams) =>
    ['message-queues', 'rabbitmq', 'queues', env, params] as const,
  rabbitQueue: (env: string, vhost: string, name: string) =>
    ['message-queues', 'rabbitmq', 'queue', env, vhost, name] as const,
  rabbitMessages: (env: string, vhost: string, name: string, count: number) =>
    ['message-queues', 'rabbitmq', 'messages', env, vhost, name, count] as const,
  kafkaTopics: (env: string, params: KafkaTopicParams) =>
    ['message-queues', 'kafka', 'topics', env, params] as const,
  kafkaTopic: (env: string, name: string) =>
    ['message-queues', 'kafka', 'topic', env, name] as const,
  kafkaMessages: (env: string, name: string, key: string) =>
    ['message-queues', 'kafka', 'messages', env, name, key] as const,
  kafkaGroups: (env: string, params: KafkaConsumerGroupParams) =>
    ['message-queues', 'kafka', 'groups', env, params] as const,
  kafkaGroup: (env: string, groupId: string) =>
    ['message-queues', 'kafka', 'group', env, groupId] as const,
};

function useEnv(): AppEnvironment {
  return useAppStore((s) => s.environment);
}

export function useBrokers(): UseQueryResult<BrokerStatus[]> {
  const env = useEnv();
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: queueKeys.brokers(env),
    queryFn: ({ signal }) => queuesApi.brokers(env, signal),
    staleTime: 10_000,
    refetchInterval,
  });
}

export function useBrokerHealth(
  broker: BrokerKind,
  enabled: boolean,
): UseQueryResult<BrokerHealth> {
  const env = useEnv();
  return useQuery({
    queryKey: queueKeys.brokerHealth(env, broker),
    queryFn: ({ signal }) => queuesApi.brokerHealth(env, broker, signal),
    staleTime: 10_000,
    enabled,
  });
}

export function useAlerts(): UseQueryResult<QueueAlert[]> {
  const env = useEnv();
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: queueKeys.alerts(env),
    queryFn: ({ signal }) => queuesApi.alerts(env, signal),
    staleTime: 10_000,
    refetchInterval,
  });
}

export function useDeadLetters(): UseQueryResult<DeadLetterOverview> {
  const env = useEnv();
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: queueKeys.deadLetters(env),
    queryFn: ({ signal }) => queuesApi.deadLetters(env, signal),
    staleTime: 10_000,
    refetchInterval,
  });
}

export function useRabbitQueues(
  params: RabbitQueueParams,
  enabled: boolean,
): UseQueryResult<PagedResponse<RabbitQueue>> {
  const env = useEnv();
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: queueKeys.rabbitQueues(env, params),
    queryFn: ({ signal }) => queuesApi.rabbitQueues(env, params, signal),
    staleTime: 5_000,
    placeholderData: (prev) => prev,
    enabled,
    refetchInterval,
  });
}

export function useRabbitQueue(
  vhost: string,
  name: string,
  enabled: boolean,
): UseQueryResult<RabbitQueue> {
  const env = useEnv();
  return useQuery({
    queryKey: queueKeys.rabbitQueue(env, vhost, name),
    queryFn: ({ signal }) => queuesApi.rabbitQueue(env, vhost, name, signal),
    enabled,
  });
}

/** Önizleme çağrısı mesajları requeue eder; sabit tut, otomatik yenileme yok. */
export function useRabbitMessages(
  vhost: string,
  name: string,
  count: number,
  enabled: boolean,
): UseQueryResult<RabbitMessagePreview[]> {
  const env = useEnv();
  return useQuery({
    queryKey: queueKeys.rabbitMessages(env, vhost, name, count),
    queryFn: ({ signal }) => queuesApi.rabbitMessages(env, vhost, name, count, signal),
    staleTime: Infinity,
    gcTime: 0,
    enabled,
  });
}

export function useKafkaTopics(
  params: KafkaTopicParams,
  enabled: boolean,
): UseQueryResult<PagedResponse<KafkaTopic>> {
  const env = useEnv();
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: queueKeys.kafkaTopics(env, params),
    queryFn: ({ signal }) => queuesApi.kafkaTopics(env, params, signal),
    staleTime: 5_000,
    placeholderData: (prev) => prev,
    enabled,
    refetchInterval,
  });
}

export function useKafkaTopic(name: string, enabled: boolean): UseQueryResult<KafkaTopicDetail> {
  const env = useEnv();
  return useQuery({
    queryKey: queueKeys.kafkaTopic(env, name),
    queryFn: ({ signal }) => queuesApi.kafkaTopic(env, name, signal),
    enabled,
  });
}

export function useKafkaMessages(
  name: string,
  query: { partition?: number | undefined; fromOffset?: number | undefined; count: number },
  enabled: boolean,
): UseQueryResult<KafkaMessagePreview[]> {
  const env = useEnv();
  const key = `${query.partition ?? 'all'}:${query.fromOffset ?? 'tail'}:${query.count}`;
  return useQuery({
    queryKey: queueKeys.kafkaMessages(env, name, key),
    queryFn: ({ signal }) => queuesApi.kafkaMessages(env, name, query, signal),
    staleTime: Infinity,
    gcTime: 0,
    enabled,
  });
}

export function useKafkaConsumerGroups(
  params: KafkaConsumerGroupParams,
  enabled: boolean,
): UseQueryResult<KafkaConsumerGroup[]> {
  const env = useEnv();
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: queueKeys.kafkaGroups(env, params),
    queryFn: ({ signal }) => queuesApi.kafkaConsumerGroups(env, params, signal),
    staleTime: 5_000,
    placeholderData: (prev) => prev,
    enabled,
    refetchInterval,
  });
}

export function useKafkaConsumerGroup(
  groupId: string,
  enabled: boolean,
): UseQueryResult<KafkaConsumerGroupDetail> {
  const env = useEnv();
  return useQuery({
    queryKey: queueKeys.kafkaGroup(env, groupId),
    queryFn: ({ signal }) => queuesApi.kafkaConsumerGroup(env, groupId, signal),
    enabled,
  });
}
