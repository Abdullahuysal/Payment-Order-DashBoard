import type { RabbitQueue } from './types';

export type ScopeMatcher = (name: string) => boolean;

export const MATCH_ALL: ScopeMatcher = () => true;

function toRegExp(pattern: string): RegExp {
  const body = pattern
    .split('*')
    .map((seg) => seg.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  if (pattern.includes('*')) return new RegExp(`^${body}$`, 'i');
  return new RegExp(body, 'i');
}

export function compileMatcher(patterns: readonly string[]): ScopeMatcher {
  const active = patterns.map((p) => p.trim()).filter(Boolean);
  if (active.length === 0) return MATCH_ALL;
  const regexes = active.map(toRegExp);
  return (name) => regexes.some((re) => re.test(name));
}

/**
 * `nameContains` ile sunucu tarafında daraltmak için her desenin ilk `*` öncesi düz kısmı.
 * Bir desen daraltılamıyorsa (2 karakterden kısa ön ek) boş dizi döner → geniş çekilir.
 */
export function deriveServerHints(patterns: readonly string[]): string[] {
  const hints = new Set<string>();
  for (const raw of patterns) {
    const p = raw.trim();
    if (!p) continue;
    const star = p.indexOf('*');
    const literal = (star === -1 ? p : p.slice(0, star)).trim();
    if (literal.length < 2) return [];
    hints.add(literal);
  }
  return [...hints];
}

export function isTooBroad(pattern: string): boolean {
  const p = pattern.trim();
  return p === '' || p === '*' || p === '**' || /^\*+$/.test(p);
}

export type QueueCategory = 'error' | 'skip' | 'backlog';

export const CATEGORY_LABEL: Record<QueueCategory, string> = {
  error: 'Hatalı / DLQ',
  skip: 'Skip',
  backlog: 'Birikme',
};

export const CATEGORY_TONE: Record<QueueCategory, 'down' | 'degraded'> = {
  error: 'down',
  skip: 'degraded',
  backlog: 'degraded',
};

const ERROR_NAME = /(^|[._-])(error|errors|dlq|dead[._-]?letter|failed|failure|poison)([._-]|$)/i;
const SKIP_NAME = /(^|[._-])(skip|skipped|parked|quarantine|hold)([._-]|$)/i;

export const BACKLOG_MIN = 100;

export function isBacklog(q: RabbitQueue): boolean {
  return q.messagesReady > 0 && (q.consumers === 0 || q.messagesReady >= BACKLOG_MIN);
}

export function classifyRabbitQueue(q: RabbitQueue): Set<QueueCategory> {
  const cats = new Set<QueueCategory>();
  if (q.isDeadLetter || ERROR_NAME.test(q.name)) cats.add('error');
  if (SKIP_NAME.test(q.name)) cats.add('skip');
  if (isBacklog(q)) cats.add('backlog');
  return cats;
}
