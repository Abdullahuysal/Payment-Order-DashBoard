import type { DevToolTransform, OptionState } from '../types';
import { readStr, requireInput } from './_shared';

interface CurlShape {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

function tokenize(command: string): string[] {
  const joined = command.replace(/\\\r?\n/g, ' ');
  const tokens: string[] = [];
  const pattern = /"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(joined)) !== null) {
    if (match[1] !== undefined) tokens.push(match[1].replace(/\\(.)/g, '$1'));
    else if (match[2] !== undefined) tokens.push(match[2]);
    else if (match[3] !== undefined) tokens.push(match[3]);
  }
  return tokens;
}

const DATA_FLAGS = new Set(['-d', '--data', '--data-raw', '--data-binary', '--data-ascii']);
const HEADER_FLAGS = new Set(['-H', '--header']);
const METHOD_FLAGS = new Set(['-X', '--request']);

function parseCurl(source: string): DevToolTransform {
  const tokens = tokenize(source);
  if (tokens.length === 0 || tokens[0]?.toLowerCase() !== 'curl') {
    throw new Error('Girdi `curl` ile başlamıyor.');
  }

  const shape: CurlShape = { method: '', url: '', headers: {}, body: '' };

  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i] ?? '';
    if (METHOD_FLAGS.has(token)) {
      shape.method = (tokens[i + 1] ?? '').toUpperCase();
      i += 1;
    } else if (HEADER_FLAGS.has(token)) {
      const raw = tokens[i + 1] ?? '';
      const sep = raw.indexOf(':');
      if (sep > 0) shape.headers[raw.slice(0, sep).trim()] = raw.slice(sep + 1).trim();
      i += 1;
    } else if (DATA_FLAGS.has(token)) {
      shape.body = tokens[i + 1] ?? '';
      i += 1;
    } else if (token === '--url') {
      shape.url = tokens[i + 1] ?? '';
      i += 1;
    } else if (!token.startsWith('-') && shape.url === '') {
      shape.url = token;
    }
  }

  if (shape.method === '') shape.method = shape.body !== '' ? 'POST' : 'GET';

  return {
    output: JSON.stringify(shape, null, 2),
    notes: ['cURL komutu yapıya ayrıştırıldı.'],
    stats: [
      { label: 'Header', value: String(Object.keys(shape.headers).length) },
      { label: 'Method', value: shape.method },
    ],
  };
}

function quote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildCurl(source: string): DevToolTransform {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source) as unknown;
  } catch (cause) {
    throw new Error(`Geçersiz JSON: ${(cause as Error).message}`);
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Geçersiz JSON: nesne bekleniyor.');
  }

  const shape = parsed as Partial<CurlShape>;
  const method =
    typeof shape.method === 'string' && shape.method ? shape.method.toUpperCase() : 'GET';
  const url = typeof shape.url === 'string' ? shape.url : '';
  const headers =
    shape.headers && typeof shape.headers === 'object'
      ? (shape.headers as Record<string, unknown>)
      : {};
  const body = typeof shape.body === 'string' ? shape.body : '';

  const parts = ['curl', '-X', method, quote(url)];
  for (const [key, value] of Object.entries(headers)) {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    parts.push('-H', quote(`${key}: ${text}`));
  }
  if (body !== '') parts.push('--data', quote(body));

  return {
    output: parts.join(' '),
    notes: ['Yapıdan tek satır cURL komutu üretildi.'],
    stats: [
      { label: 'Header', value: String(Object.keys(headers).length) },
      { label: 'Method', value: method },
    ],
  };
}

export function convertCurl(input: string, options: OptionState): DevToolTransform {
  const source = requireInput(input, 'işlenecek cURL');
  return readStr(options, 'mode', 'parse') === 'build' ? buildCurl(source) : parseCurl(source);
}
