import type { DevToolTransform, OptionState } from '../types';
import { readBool, readStr, requireInput } from './_shared';

const TIME_CLAIMS = ['exp', 'iat', 'nbf'] as const;

function decodeSegment(segment: string, label: string): unknown {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error(`Geçersiz base64: JWT ${label} bölümü çözülemedi.`);
  }
  const bytes = Uint8Array.from({ length: binary.length }, (_, i) => binary.charCodeAt(i));
  const text = new TextDecoder().decode(bytes);
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new Error(`Geçersiz JSON: JWT ${label} bölümü çözülemedi (${(cause as Error).message}).`);
  }
}

function toIso(epochSeconds: unknown): string | undefined {
  if (typeof epochSeconds !== 'number' || !Number.isFinite(epochSeconds)) return undefined;
  return new Date(epochSeconds * 1000).toISOString();
}

export function decodeJwt(input: string, options: OptionState): DevToolTransform {
  const source = requireInput(input, 'çözülecek JWT');
  const parts = source.split('.');
  if (parts.length !== 3) {
    throw new Error(
      `JWT üç bölümden oluşmalı (header.payload.signature); ${parts.length} bölüm bulundu.`,
    );
  }

  const part = readStr(options, 'part', 'both');
  const decodeTimes = readBool(options, 'decodeTimes', false);

  const header = decodeSegment(parts[0] ?? '', 'header') as Record<string, unknown>;
  const payload = decodeSegment(parts[1] ?? '', 'payload') as Record<string, unknown>;

  const pretty = (value: unknown): string => JSON.stringify(value, null, 2);
  const output =
    part === 'header'
      ? pretty(header)
      : part === 'payload'
        ? pretty(payload)
        : pretty({ header, payload });

  const notes: string[] = ['İmza doğrulanmadı — yalnızca çözüldü.'];

  const expIso = toIso(payload['exp']);
  let lifetime = '-';
  if (typeof payload['exp'] === 'number') {
    lifetime = payload['exp'] * 1000 < Date.now() ? 'doldu' : 'geçerli';
  }

  if (decodeTimes) {
    for (const claim of TIME_CLAIMS) {
      const iso = toIso(payload[claim]);
      if (iso) notes.push(`${claim}: ${iso}`);
    }
    if (lifetime !== '-') {
      notes.push(lifetime === 'doldu' ? 'Token süresi doldu.' : 'Token süresi geçerli.');
    }
  }

  return {
    output,
    notes,
    stats: [
      { label: 'alg', value: typeof header['alg'] === 'string' ? String(header['alg']) : '-' },
      { label: 'exp', value: expIso ?? '-' },
      { label: 'Süre', value: lifetime },
    ],
  };
}
