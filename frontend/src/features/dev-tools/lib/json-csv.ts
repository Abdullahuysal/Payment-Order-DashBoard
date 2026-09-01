import type { DevToolTransform, OptionState } from '../types';
import { readBool, readStr, requireInput } from './_shared';

const DELIMITERS: Record<string, string> = { comma: ',', semicolon: ';', tab: '\t' };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return JSON.stringify(value);
}

function escapeCsv(text: string, delimiter: string): string {
  if (text.includes(delimiter) || text.includes('"') || /[\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);

  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last && last.length === 1 && last[0] === '') rows.pop();
    else break;
  }
  return rows;
}

function jsonToCsv(source: string, delimiter: string, header: boolean): DevToolTransform {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source) as unknown;
  } catch (cause) {
    throw new Error(`Geçersiz JSON: ${(cause as Error).message}`);
  }
  if (!Array.isArray(parsed)) throw new Error('json2csv için girdi bir dizi olmalı.');
  if (parsed.length === 0) throw new Error('Dizi boş — CSV üretilemedi.');

  const columns: string[] = [];
  for (const item of parsed) {
    if (!isPlainObject(item)) throw new Error('Dizinin her elemanı düz bir nesne olmalı.');
    for (const key of Object.keys(item)) if (!columns.includes(key)) columns.push(key);
  }

  const lines: string[] = [];
  if (header) lines.push(columns.map((col) => escapeCsv(col, delimiter)).join(delimiter));
  for (const item of parsed as Record<string, unknown>[]) {
    lines.push(columns.map((col) => escapeCsv(cellToText(item[col]), delimiter)).join(delimiter));
  }

  return {
    output: lines.join('\n'),
    notes: ['JSON nesne dizisi CSV satırlarına çevrildi.'],
    stats: [
      { label: 'Satır', value: String(parsed.length) },
      { label: 'Kolon', value: String(columns.length) },
    ],
  };
}

function csvToJson(source: string, delimiter: string, header: boolean): DevToolTransform {
  const table = parseCsv(source, delimiter);
  if (table.length === 0) throw new Error('CSV boş — JSON üretilemedi.');

  const width = table[0]?.length ?? 0;
  for (const row of table) {
    if (row.length !== width) {
      throw new Error(`Kolon sayısı tutarsız: ${width} beklenirken ${row.length} bulundu.`);
    }
  }

  const columns = header
    ? (table[0] ?? [])
    : Array.from({ length: width }, (_, i) => `col${i + 1}`);
  const dataRows = header ? table.slice(1) : table;

  const records = dataRows.map((row) => {
    const record: Record<string, string> = {};
    columns.forEach((col, i) => {
      record[col] = row[i] ?? '';
    });
    return record;
  });

  return {
    output: JSON.stringify(records, null, 2),
    notes: ['CSV satırları nesne dizisine çevrildi.'],
    stats: [
      { label: 'Satır', value: String(records.length) },
      { label: 'Kolon', value: String(width) },
    ],
  };
}

export function convertJsonCsv(input: string, options: OptionState): DevToolTransform {
  const source = requireInput(input, 'çevrilecek içerik');
  const mode = readStr(options, 'mode', 'json2csv');
  const delimiter = DELIMITERS[readStr(options, 'delimiter', 'comma')] ?? ',';
  const header = readBool(options, 'header', true);
  return mode === 'csv2json'
    ? csvToJson(source, delimiter, header)
    : jsonToCsv(source, delimiter, header);
}
