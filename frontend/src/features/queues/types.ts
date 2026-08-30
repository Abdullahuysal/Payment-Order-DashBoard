export type BrokerKind = 'rabbitmq' | 'kafka';

export const BROKER_LABEL: Record<BrokerKind, string> = {
  rabbitmq: 'RabbitMQ',
  kafka: 'Kafka',
};

/** `/brokers` asla 503 dönmez; ekran bu diziye göre kurulur. */
export interface BrokerStatus {
  broker: BrokerKind;
  configured: boolean;
  reachable: boolean;
  version?: string | undefined;
  detail?: string | undefined;
  error?: string | undefined;
}

export interface BrokerHealth {
  broker: BrokerKind;
  configured: boolean;
  reachable: boolean;
  version?: string | undefined;
  detail?: string | undefined;
  error?: string | undefined;
  latencyMs?: number | undefined;
  checks?: Array<{ name: string; ok: boolean; detail?: string | undefined }> | undefined;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface RabbitQueue {
  name: string;
  virtualHost: string;
  state: string;
  messages: number;
  messagesReady: number;
  messagesUnacknowledged: number;
  consumers: number;
  publishRate: number;
  deliverRate: number;
  redeliverRate: number;
  idleSince?: string | undefined;
  isDeadLetter: boolean;
  hasDeadLetterConfigured: boolean;
}

export interface XDeath {
  reason?: string | undefined;
  queue?: string | undefined;
  exchange?: string | undefined;
  count?: number | undefined;
  time?: string | undefined;
  routingKeys?: string[] | undefined;
}

export interface RabbitMessagePreview {
  routingKey?: string | undefined;
  exchange?: string | undefined;
  redelivered?: boolean | undefined;
  payloadBytes?: number | undefined;
  payload?: string | undefined;
  properties?: Record<string, unknown> | undefined;
  headers?: Record<string, unknown> | undefined;
  deaths?: XDeath[] | undefined;
}

export interface RabbitQueueParams {
  nameContains?: string | undefined;
  onlyProblems?: boolean | undefined;
  deadLetterOnly?: boolean | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface KafkaTopic {
  name: string;
  partitions: number;
  replicationFactor?: number | undefined;
  isInternal: boolean;
  /** List uçlarında daima `-1`; kesin sayı için topic detayına git. */
  approxMessageCount: number;
  isDeadLetter: boolean;
  hasProblems?: boolean | undefined;
}

export interface KafkaPartition {
  partition: number;
  lowWatermark: number;
  highWatermark: number;
  messageCount: number;
  isr: number[];
  replicas?: number[] | undefined;
  leader?: number | undefined;
}

export interface KafkaTopicDetail {
  name: string;
  isInternal?: boolean | undefined;
  messageCount: number;
  partitions: KafkaPartition[];
}

export interface KafkaMessagePreview {
  partition: number;
  offset: number;
  key?: string | undefined;
  value?: string | undefined;
  timestamp?: string | undefined;
  headers?: Record<string, unknown> | undefined;
}

export interface KafkaConsumerGroup {
  groupId: string;
  state: string;
  isSimple: boolean;
  members: number;
  totalLag: number;
  topics: string[];
}

export interface KafkaGroupMember {
  memberId: string;
  clientId?: string | undefined;
  host?: string | undefined;
  assignments?: string[] | undefined;
}

export interface KafkaGroupPartition {
  topic: string;
  partition: number;
  committedOffset: number;
  highWatermark: number;
  lag: number;
}

export interface KafkaConsumerGroupDetail {
  groupId: string;
  state: string;
  isSimple: boolean;
  totalLag: number;
  members: KafkaGroupMember[];
  partitions: KafkaGroupPartition[];
}

export interface KafkaTopicParams {
  nameContains?: string | undefined;
  includeInternal?: boolean | undefined;
  deadLetterOnly?: boolean | undefined;
  onlyProblems?: boolean | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface KafkaConsumerGroupParams {
  groupContains?: string | undefined;
  onlyLagging?: boolean | undefined;
  minLag?: number | undefined;
}

export interface DeadLetterItem {
  broker: BrokerKind;
  kind: 'queue' | 'topic';
  name: string;
  messageCount: number;
  sampledAt?: string | undefined;
  lastReason?: string | undefined;
}

/** `/dead-letters` her zaman 200; `warnings` = configure edilmemiş/erişilemeyen broker'lar. */
export interface DeadLetterOverview {
  items: DeadLetterItem[];
  totalDeadLettered: number;
  warnings: string[];
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface QueueAlert {
  severity: AlertSeverity;
  broker: BrokerKind;
  resource: string;
  kind: string;
  message: string;
  value?: number | string | undefined;
}
