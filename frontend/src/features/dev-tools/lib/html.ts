import type { DevToolTransform, OptionState } from '../types';
import { readBool, readStr, requireInput } from './_shared';

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);
const RAW_ELEMENTS = ['script', 'style', 'pre', 'textarea'];
const RAW_BLOCK = new RegExp(`<(${RAW_ELEMENTS.join('|')})\\b[^>]*>[\\s\\S]*?</\\1>`, 'gi');
const TOKENS = /<!--[\s\S]*?-->|<[^>]+>|[^<]+/g;

function indentUnit(token: string): string {
  if (token === 'tab') return '\t';
  if (token === '4') return '    ';
  return '  ';
}

function tagName(token: string): string {
  return (token.replace(/^<\/?/, '').match(/^[a-zA-Z0-9:-]+/)?.[0] ?? '').toLowerCase();
}

function isComment(token: string): boolean {
  return token.startsWith('<!--');
}

function isClosing(token: string): boolean {
  return token.startsWith('</');
}

function isOpening(token: string): boolean {
  return (
    token.startsWith('<') &&
    !token.startsWith('</') &&
    !token.startsWith('<!') &&
    !token.startsWith('<?')
  );
}

function mask(html: string): { masked: string; blocks: string[] } {
  const blocks: string[] = [];
  const masked = html.replace(RAW_BLOCK, (block) => {
    blocks.push(block);
    return ` RAW${blocks.length - 1} `;
  });
  return { masked, blocks };
}

function countElements(html: string): number {
  return (html.match(/<(?![/!?])/g) ?? []).length;
}

function pretty(masked: string, blocks: string[], pad: string, removeComments: boolean): string {
  const tokens = masked.match(TOKENS) ?? [];
  const lines: string[] = [];
  let depth = 0;

  for (const rawToken of tokens) {
    const token = rawToken.trim();
    if (token.length === 0) continue;

    const rawMatch = /^ RAW(\d+) $/.exec(token);
    if (rawMatch) {
      const block = blocks[Number(rawMatch[1])] ?? '';
      const blockLines = block.split(/\r\n|\r|\n/);
      blockLines.forEach((blockLine, i) => {
        lines.push(i === 0 ? pad.repeat(depth) + blockLine : blockLine);
      });
      continue;
    }

    if (isComment(token)) {
      if (!removeComments) lines.push(pad.repeat(depth) + token);
      continue;
    }

    if (isClosing(token)) {
      depth = Math.max(0, depth - 1);
      lines.push(pad.repeat(depth) + token);
      continue;
    }

    if (isOpening(token)) {
      const name = tagName(token);
      const selfClosing = token.endsWith('/>') || VOID_ELEMENTS.has(name);
      lines.push(pad.repeat(depth) + token);
      if (!selfClosing) depth += 1;
      continue;
    }

    lines.push(pad.repeat(depth) + token);
  }

  return lines.join('\n');
}

export function formatHtml(input: string, options: OptionState): DevToolTransform {
  const source = requireInput(input, 'biçimlendirilecek HTML');
  const minify = readStr(options, 'mode', 'pretty') === 'minify';
  const removeComments = readBool(options, 'removeComments', false);
  const { masked, blocks } = mask(source);

  let output: string;
  const notes: string[] = [];

  if (minify) {
    let work = masked;
    if (removeComments) {
      work = work.replace(/<!--[\s\S]*?-->/g, '');
      notes.push('Yorumlar atıldı.');
    }
    work = work.replace(/>\s+</g, '><').trim();
    output = work.replace(/ RAW(\d+) /g, (_, index: string) => blocks[Number(index)] ?? '');
    notes.push('Etiketler arası boşluk atıldı.');
  } else {
    output = pretty(masked, blocks, indentUnit(readStr(options, 'indent', '2')), false);
  }

  return {
    output,
    notes,
    stats: [
      { label: 'Öğe', value: String(countElements(source)) },
      { label: 'Girdi', value: `${source.length} krkt` },
      { label: 'Çıktı', value: `${output.length} krkt` },
    ],
  };
}
