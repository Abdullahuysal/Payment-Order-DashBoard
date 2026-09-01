import type { DevToolTransform, OptionState } from '../types';
import { padColumns, readBool, readStr, requireInput, splitLines } from './_shared';

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

function detectBase(token: string): number {
  const bare = token.replace(/^-/, '').toLowerCase();
  if (bare.startsWith('0x')) return 16;
  if (bare.startsWith('0o')) return 8;
  if (bare.startsWith('0b')) return 2;
  return 10;
}

function parseBig(token: string, base: number): bigint {
  let text = token.trim().toLowerCase();
  let negative = false;
  if (text.startsWith('-')) {
    negative = true;
    text = text.slice(1);
  }
  if (base === 16 && text.startsWith('0x')) text = text.slice(2);
  else if (base === 8 && text.startsWith('0o')) text = text.slice(2);
  else if (base === 2 && text.startsWith('0b')) text = text.slice(2);
  if (text.length === 0) throw new Error(`Geçersiz basamak: "${token}" boş sayı.`);

  const radix = BigInt(base);
  let value = 0n;
  for (const char of text) {
    const digit = DIGITS.indexOf(char);
    if (digit < 0 || digit >= base) {
      throw new Error(`Geçersiz basamak: "${char}" (${base} tabanında geçersiz).`);
    }
    value = value * radix + BigInt(digit);
  }
  return negative ? -value : value;
}

export function convertNumberBase(input: string, options: OptionState): DevToolTransform {
  requireInput(input, 'çevrilecek sayı');
  const from = readStr(options, 'from', 'auto');
  const to = readStr(options, 'to', '10');
  const showAll = readBool(options, 'showAll', false);

  const rows: string[][] = [];
  let lineCount = 0;

  for (const line of splitLines(input)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    lineCount += 1;
    const base = from === 'auto' ? detectBase(trimmed) : Number(from);
    const value = parseBig(trimmed, base);
    if (showAll) {
      rows.push([
        trimmed,
        `bin=${value.toString(2)}  oct=${value.toString(8)}  dec=${value.toString(10)}  hex=${value.toString(16)}`,
      ]);
    } else {
      rows.push([trimmed, value.toString(Number(to))]);
    }
  }

  if (lineCount === 0) throw new Error('Girdi boş — çevrilecek sayı yok.');

  return {
    output: padColumns(rows).join('\n'),
    notes: [showAll ? 'Her satır dört tabanda gösterildi.' : `Hedef taban: ${to}.`],
    stats: [{ label: 'Satır', value: String(lineCount) }],
  };
}
