import type { OptionState, OptionValue } from '../types';

export { splitLines } from '../lib';

export function readStr(options: OptionState, key: string, fallback: string): string {
  const raw: OptionValue | undefined = options[key];
  return typeof raw === 'string' ? raw : fallback;
}

export function readBool(options: OptionState, key: string, fallback: boolean): boolean {
  const raw: OptionValue | undefined = options[key];
  return typeof raw === 'boolean' ? raw : fallback;
}

export function readNum(options: OptionState, key: string, fallback: number): number {
  const raw: OptionValue | undefined = options[key];
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) {
    return Number(raw);
  }
  return fallback;
}

export function requireInput(input: string, what: string): string {
  const source = input.trim();
  if (source.length === 0) throw new Error(`Girdi boş — ${what} yok.`);
  return source;
}

export function padColumns(rows: readonly string[][], gap = 2): string[] {
  const widths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      widths[i] = Math.max(widths[i] ?? 0, cell.length);
    });
  }
  return rows.map((row) =>
    row
      .map((cell, i) => (i === row.length - 1 ? cell : cell.padEnd((widths[i] ?? 0) + gap)))
      .join('')
      .trimEnd(),
  );
}
