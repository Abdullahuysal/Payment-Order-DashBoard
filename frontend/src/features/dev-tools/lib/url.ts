import type { DevToolTransform, OptionState } from '../types';
import { padColumns, readStr, requireInput, splitLines } from './_shared';

type QueryMap = Record<string, string | string[]>;

function collectQuery(params: URLSearchParams): QueryMap {
  const out: QueryMap = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    out[key] = all.length > 1 ? all : (all[0] ?? '');
  }
  return out;
}

function countParams(query: QueryMap): number {
  return Object.values(query).reduce<number>(
    (sum, value) => sum + (Array.isArray(value) ? value.length : 1),
    0,
  );
}

function toRows(query: QueryMap): string[][] {
  const rows: string[][] = [];
  for (const [key, value] of Object.entries(query)) {
    rows.push([key, Array.isArray(value) ? value.join(', ') : value]);
  }
  return rows;
}

function parseUrl(source: string, format: string): DevToolTransform {
  let url: URL | undefined;
  try {
    url = new URL(source);
  } catch {
    url = undefined;
  }

  if (!url) {
    if (source.includes('://')) throw new Error('Geçersiz URL: ayrıştırılamadı.');
    const params = new URLSearchParams(source.startsWith('?') ? source.slice(1) : source);
    const query = collectQuery(params);
    const output =
      format === 'table' ? padColumns(toRows(query)).join('\n') : JSON.stringify(query, null, 2);
    return {
      output,
      notes: ['Girdi query string olarak ayrıştırıldı.'],
      stats: [
        { label: 'Parametre', value: String(countParams(query)) },
        { label: 'Çıktı', value: `${output.length} krkt` },
      ],
    };
  }

  const query = collectQuery(url.searchParams);
  const shape = {
    protocol: url.protocol.replace(/:$/, ''),
    host: url.hostname,
    port: url.port || null,
    pathname: url.pathname,
    query,
    hash: url.hash ? url.hash.slice(1) : '',
  };

  const output =
    format === 'table'
      ? padColumns([
          ['protocol', shape.protocol],
          ['host', shape.host],
          ['port', shape.port ?? '-'],
          ['pathname', shape.pathname],
          ['hash', shape.hash || '-'],
          ...toRows(query).map(([key, value]) => [`query.${key ?? ''}`, value ?? '']),
        ]).join('\n')
      : JSON.stringify(shape, null, 2);

  return {
    output,
    notes: ['Tam URL ayrıştırıldı.'],
    stats: [
      { label: 'Parametre', value: String(countParams(query)) },
      { label: 'Çıktı', value: `${output.length} krkt` },
    ],
  };
}

function buildQuery(source: string): DevToolTransform {
  const params = new URLSearchParams();
  let pairs = 0;
  for (const line of splitLines(source)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const eq = trimmed.indexOf('=');
    const key = eq === -1 ? trimmed : trimmed.slice(0, eq);
    const value = eq === -1 ? '' : trimmed.slice(eq + 1);
    params.append(key, value);
    pairs += 1;
  }
  if (pairs === 0) throw new Error('Girdi boş — oluşturulacak parametre yok.');
  const output = params.toString();
  return {
    output,
    notes: ['Satırlar encode edilmiş query string olarak birleştirildi.'],
    stats: [
      { label: 'Parametre', value: String(pairs) },
      { label: 'Çıktı', value: `${output.length} krkt` },
    ],
  };
}

export function parseUrlQuery(input: string, options: OptionState): DevToolTransform {
  const source = requireInput(input, 'ayrıştırılacak URL');
  const mode = readStr(options, 'mode', 'parse');
  const format = readStr(options, 'format', 'json');
  return mode === 'build' ? buildQuery(source) : parseUrl(source, format);
}
