import type { DevToolTransform, OptionState } from '../types';
import { readBool, readStr, requireInput } from './_shared';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parse(source: string): unknown {
  try {
    return JSON.parse(source) as unknown;
  } catch (cause) {
    throw new Error(`Geçersiz JSON: ${(cause as Error).message}`);
  }
}

function flattenInto(
  value: unknown,
  prefix: string,
  delimiter: string,
  arrayIndices: boolean,
  out: Record<string, unknown>,
): void {
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      if (prefix) out[prefix] = {};
      return;
    }
    for (const [key, child] of entries) {
      const next = prefix ? `${prefix}${delimiter}${key}` : key;
      flattenInto(child, next, delimiter, arrayIndices, out);
    }
    return;
  }
  if (Array.isArray(value) && arrayIndices) {
    if (value.length === 0) {
      if (prefix) out[prefix] = [];
      return;
    }
    value.forEach((child, index) => {
      const next = prefix ? `${prefix}${delimiter}${index}` : String(index);
      flattenInto(child, next, delimiter, arrayIndices, out);
    });
    return;
  }
  out[prefix] = value;
}

function unflatten(flat: Record<string, unknown>, delimiter: string): unknown {
  const root: Record<string, unknown> = {};
  for (const [flatKey, value] of Object.entries(flat)) {
    const segments = flatKey.split(delimiter);
    let cursor: Record<string, unknown> = root;
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        cursor[segment] = value;
        return;
      }
      const existing = cursor[segment];
      if (!isPlainObject(existing)) {
        const created: Record<string, unknown> = {};
        cursor[segment] = created;
        cursor = created;
      } else {
        cursor = existing;
      }
    });
  }
  return arraify(root);
}

function arraify(value: unknown): unknown {
  if (!isPlainObject(value)) return value;
  const keys = Object.keys(value);
  const allIndices = keys.length > 0 && keys.every((key) => /^\d+$/.test(key));
  if (allIndices) {
    const arr: unknown[] = [];
    for (const key of keys.sort((a, b) => Number(a) - Number(b))) {
      arr[Number(key)] = arraify(value[key]);
    }
    return arr;
  }
  const obj: Record<string, unknown> = {};
  for (const key of keys) obj[key] = arraify(value[key]);
  return obj;
}

function depthOf(value: unknown): number {
  if (Array.isArray(value)) {
    return 1 + value.reduce<number>((max, item) => Math.max(max, depthOf(item)), 0);
  }
  if (isPlainObject(value)) {
    return 1 + Object.values(value).reduce<number>((max, item) => Math.max(max, depthOf(item)), 0);
  }
  return 0;
}

export function flattenJson(input: string, options: OptionState): DevToolTransform {
  const source = requireInput(input, 'işlenecek JSON');
  const mode = readStr(options, 'mode', 'flatten');
  const delimiter = readStr(options, 'delimiter', '.') || '.';
  const arrayIndices = readBool(options, 'arrayIndices', true);

  const parsed = parse(source);

  if (mode === 'unflatten') {
    if (!isPlainObject(parsed)) {
      throw new Error('Geçersiz JSON: aç işlemi için tek seviyeli nesne bekleniyor.');
    }
    const result = unflatten(parsed, delimiter);
    const output = JSON.stringify(result, null, 2);
    return {
      output,
      notes: ['Düz anahtarlar iç içe yapıya açıldı.'],
      stats: [
        { label: 'Anahtar', value: String(Object.keys(parsed).length) },
        { label: 'Derinlik', value: String(depthOf(result)) },
      ],
    };
  }

  const out: Record<string, unknown> = {};
  flattenInto(parsed, '', delimiter, arrayIndices, out);
  const output = JSON.stringify(out, null, 2);
  const maxSegments = Object.keys(out).reduce<number>(
    (max, key) => Math.max(max, key.split(delimiter).length),
    0,
  );
  return {
    output,
    notes: ['İç içe yapı tek seviyeye düzleştirildi.'],
    stats: [
      { label: 'Anahtar', value: String(Object.keys(out).length) },
      { label: 'Derinlik', value: String(maxSegments) },
    ],
  };
}
