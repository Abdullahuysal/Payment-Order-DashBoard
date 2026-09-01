import type { DevToolTransform, OptionState } from '../types';
import { readStr, requireInput, splitLines } from './_shared';

function toWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter((word) => word.length > 0);
}

const cap = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

function applyCase(words: string[], target: string): string {
  const lower = words.map((word) => word.toLowerCase());
  switch (target) {
    case 'camel':
      return lower.map((word, i) => (i === 0 ? word : cap(word))).join('');
    case 'pascal':
      return lower.map(cap).join('');
    case 'snake':
      return lower.join('_');
    case 'kebab':
      return lower.join('-');
    case 'constant':
      return lower.join('_').toUpperCase();
    case 'sentence':
      return lower.map((word, i) => (i === 0 ? cap(word) : word)).join(' ');
    case 'title':
      return lower.map(cap).join(' ');
    default:
      return words.join(' ');
  }
}

export function convertCase(input: string, options: OptionState): DevToolTransform {
  requireInput(input, 'dönüştürülecek metin');
  const target = readStr(options, 'target', 'camel');

  const lines = splitLines(input).map((line) => {
    const words = toWords(line);
    return words.length === 0 ? line : applyCase(words, target);
  });

  return {
    output: lines.join('\n'),
    notes: [`Hedef kılıf: ${target}.`],
    stats: [{ label: 'Satır', value: String(lines.length) }],
  };
}
