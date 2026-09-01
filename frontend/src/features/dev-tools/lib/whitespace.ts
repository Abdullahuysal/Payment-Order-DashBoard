import type { DevToolTransform, OptionState } from '../types';
import { readBool, readNum, readStr, requireInput } from './_shared';

const ZERO_WIDTH_CODES = [0x200b, 0x200c, 0x200d, 0xfeff];
const NBSP_CODE = 0x00a0;
const ZERO_WIDTH = new RegExp(
  `[${ZERO_WIDTH_CODES.map((code) => String.fromCharCode(code)).join('')}]`,
  'g',
);
const NBSP = new RegExp(String.fromCharCode(NBSP_CODE), 'g');

export function cleanWhitespace(input: string, options: OptionState): DevToolTransform {
  requireInput(input, 'temizlenecek metin');

  const trimTrailing = readBool(options, 'trimTrailing', true);
  const collapseBlank = readBool(options, 'collapseBlank', false);
  const tabsToSpaces = readBool(options, 'tabsToSpaces', false);
  const tabWidth = readNum(options, 'tabWidth', 2);
  const stripZeroWidth = readBool(options, 'stripZeroWidth', true);
  const nbspToSpace = readBool(options, 'nbspToSpace', false);
  const eol = readStr(options, 'eol', 'keep');

  const originalLines = input.split(/\r\n|\r|\n/);
  let invisibleDropped = 0;

  let working = originalLines.map((line) => {
    let next = line;
    if (stripZeroWidth) {
      const hits = next.match(ZERO_WIDTH);
      if (hits) invisibleDropped += hits.length;
      next = next.replace(ZERO_WIDTH, '');
    }
    if (nbspToSpace) {
      const hits = next.match(NBSP);
      if (hits) invisibleDropped += hits.length;
      next = next.replace(NBSP, ' ');
    }
    if (tabsToSpaces) next = next.replace(/\t/g, ' '.repeat(Math.max(1, tabWidth)));
    if (trimTrailing) next = next.replace(/[ \t]+$/, '');
    return next;
  });

  if (collapseBlank) {
    const collapsed: string[] = [];
    let blankRun = 0;
    for (const line of working) {
      if (line.trim().length === 0) {
        blankRun += 1;
        if (blankRun > 1) continue;
      } else {
        blankRun = 0;
      }
      collapsed.push(line);
    }
    working = collapsed;
  }

  const changedLines = working.reduce<number>(
    (count, line, i) => count + (line === originalLines[i] ? 0 : 1),
    0,
  );

  const newline =
    eol === 'crlf' ? '\r\n' : eol === 'lf' ? '\n' : input.includes('\r\n') ? '\r\n' : '\n';
  const output = working.join(newline);

  const notes: string[] = [];
  if (collapseBlank) notes.push('Ardışık boş satırlar teke indirildi.');
  if (eol !== 'keep') notes.push(`Satır sonu ${eol.toUpperCase()} yapıldı.`);

  return {
    output,
    notes,
    stats: [
      { label: 'Değişen satır', value: String(changedLines) },
      { label: 'Atılan görünmez', value: String(invisibleDropped) },
      { label: 'Çıktı', value: `${output.length} krkt` },
    ],
  };
}
