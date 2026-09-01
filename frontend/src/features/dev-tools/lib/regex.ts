import type { DevToolTransform, OptionState } from '../types';
import { padColumns, readStr, requireInput } from './_shared';

function compile(pattern: string, flags: string): RegExp {
  try {
    return new RegExp(pattern, flags);
  } catch (cause) {
    throw new Error(`Geçersiz regex: ${(cause as Error).message}`);
  }
}

export function testRegex(input: string, options: OptionState): DevToolTransform {
  requireInput(input, 'eşleştirilecek metin');
  const pattern = readStr(options, 'pattern', '');
  if (pattern.length === 0) throw new Error('Desen boş — test edilecek regex yok.');

  const flags = readStr(options, 'flags', 'g');
  const action = readStr(options, 'action', 'match');
  const replacement = readStr(options, 'replacement', '');

  if (action === 'replace') {
    const re = compile(pattern, flags);
    const matches = input.match(compile(pattern, flags.includes('g') ? flags : `${flags}g`));
    const output = input.replace(re, replacement);
    return {
      output,
      notes: [`${matches ? matches.length : 0} eşleşme değiştirildi.`],
      stats: [{ label: 'Eşleşme', value: String(matches ? matches.length : 0) }],
    };
  }

  if (action === 'split') {
    const re = compile(pattern, flags);
    const parts = input.split(re);
    return {
      output: parts.join('\n'),
      notes: [`Metin ${parts.length} parçaya bölündü.`],
      stats: [{ label: 'Eşleşme', value: String(Math.max(0, parts.length - 1)) }],
    };
  }

  const re = compile(pattern, flags.includes('g') ? flags : `${flags}g`);
  const rows: string[][] = [['#', 'eşleşme', 'gruplar']];
  let count = 0;
  for (const match of input.matchAll(re)) {
    count += 1;
    const groups = match.slice(1).map((group) => group ?? '∅');
    rows.push([String(count), match[0], groups.join(' | ')]);
  }

  return {
    output: count === 0 ? 'Eşleşme yok.' : padColumns(rows).join('\n'),
    notes: [`Toplam ${count} eşleşme bulundu.`],
    stats: [{ label: 'Eşleşme', value: String(count) }],
  };
}
