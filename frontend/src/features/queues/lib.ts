import type {
  AlertSeverity,
  BrokerStatus,
  KafkaConsumerGroup,
  QueueAlert,
  RabbitMessagePreview,
  RabbitQueue,
  XDeath,
} from './types';

type Tone = 'neutral' | 'up' | 'degraded' | 'down';

const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

export const SEVERITY_TONE: Record<AlertSeverity, Tone> = {
  critical: 'down',
  warning: 'degraded',
  info: 'neutral',
};

export const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: 'Kritik',
  warning: 'Uyarı',
  info: 'Bilgi',
};

export function sortAlerts(alerts: readonly QueueAlert[]): QueueAlert[] {
  return [...alerts].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.broker.localeCompare(b.broker) ||
      a.resource.localeCompare(b.resource),
  );
}

export type BrokerPhase = 'ok' | 'unconfigured' | 'unreachable';

export function brokerPhase(status: BrokerStatus | undefined): BrokerPhase {
  if (!status || !status.configured) return 'unconfigured';
  if (!status.reachable) return 'unreachable';
  return 'ok';
}

export const BROKER_PHASE_TONE: Record<BrokerPhase, Tone> = {
  ok: 'up',
  unconfigured: 'neutral',
  unreachable: 'down',
};

export const BROKER_PHASE_LABEL: Record<BrokerPhase, string> = {
  ok: 'Bağlı',
  unconfigured: 'Yapılandırılmadı',
  unreachable: 'Erişilemiyor',
};

export function rabbitStateTone(state: string): Tone {
  const s = state.toLowerCase();
  if (s === 'running') return 'up';
  if (s === 'idle' || s === 'flow') return 'degraded';
  return 'down';
}

/** Durdu, tüketicisiz birikme, redelivery ya da dolu DLQ → dikkat gerektirir. */
export function rabbitHasProblem(q: RabbitQueue): boolean {
  return (
    q.state.toLowerCase() !== 'running' ||
    (q.messagesReady > 0 && q.consumers === 0) ||
    q.redeliverRate > 0 ||
    (q.isDeadLetter && q.messages > 0)
  );
}

export function consumerStateTone(state: string): Tone {
  const s = state.toLowerCase();
  if (s === 'stable') return 'up';
  if (s === 'preparingrebalance' || s === 'completingrebalance' || s === 'empty') return 'degraded';
  return 'down';
}

export function lagTone(lag: number): Tone {
  if (lag <= 0) return 'up';
  if (lag < 1_000) return 'degraded';
  return 'down';
}

export function groupHasProblem(g: KafkaConsumerGroup): boolean {
  return g.totalLag > 0 || g.state.toLowerCase() !== 'stable';
}

/** `deaths` yoksa RabbitMQ `x-death` header'ını (AMQP array-of-table) savunmacı düzleştirir. */
export function resolveDeaths(msg: RabbitMessagePreview): XDeath[] {
  if (msg.deaths?.length) return msg.deaths;
  const raw = msg.headers?.['x-death'];
  if (!Array.isArray(raw)) return [];
  return raw.map((entry): XDeath => {
    const e = (entry ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
    const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
    return {
      reason: str(e['reason']),
      queue: str(e['queue']),
      exchange: str(e['exchange']),
      count: num(e['count']),
      time:
        str(e['time']) ??
        (typeof e['time'] === 'number' ? new Date(e['time']).toISOString() : undefined),
      routingKeys: Array.isArray(e['routing-keys'])
        ? (e['routing-keys'] as unknown[]).map(String)
        : undefined,
    };
  });
}
