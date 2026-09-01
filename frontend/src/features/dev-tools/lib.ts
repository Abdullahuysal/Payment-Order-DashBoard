import type { DevToolTransform, OptionState, OptionValue } from './types';

const tr = (value: string): string => value.toLocaleLowerCase('tr');

function str(options: OptionState, key: string, fallback: string): string {
  const raw: OptionValue | undefined = options[key];
  return typeof raw === 'string' ? raw : fallback;
}

function bool(options: OptionState, key: string, fallback: boolean): boolean {
  const raw: OptionValue | undefined = options[key];
  return typeof raw === 'boolean' ? raw : fallback;
}

function indentUnit(token: string): string {
  if (token === 'tab') return '\t';
  if (token === '4') return '    ';
  return '  ';
}

export function splitLines(input: string): string[] {
  return input.split(/\r\n|\r|\n/);
}

function prepareList(
  input: string,
  opts: { trim: boolean; dropEmpty: boolean; ignoreCase: boolean; dedupe: boolean },
): { items: string[]; total: number; removedDuplicates: number; removedEmpty: number } {
  const raw = splitLines(input);
  const total = raw.length;

  let working = opts.trim ? raw.map((line) => line.trim()) : raw;

  let removedEmpty = 0;
  if (opts.dropEmpty) {
    const kept = working.filter((line) => line.trim().length > 0);
    removedEmpty = working.length - kept.length;
    working = kept;
  }

  let removedDuplicates = 0;
  if (opts.dedupe) {
    const seen = new Set<string>();
    const kept: string[] = [];
    for (const line of working) {
      const key = opts.ignoreCase ? tr(line) : line;
      if (seen.has(key)) {
        removedDuplicates += 1;
        continue;
      }
      seen.add(key);
      kept.push(line);
    }
    working = kept;
  }

  return { items: working, total, removedDuplicates, removedEmpty };
}

function sortItems(items: string[], direction: string): string[] {
  if (direction === 'none') return items;
  const sorted = [...items].sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }));
  return direction === 'desc' ? sorted.reverse() : sorted;
}

function countJsonNodes(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + countJsonNodes(item), 1);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).reduce<number>((sum, item) => sum + countJsonNodes(item), 1);
  }
  return 1;
}

function jsonDepth(value: unknown): number {
  if (Array.isArray(value)) {
    return 1 + value.reduce<number>((max, item) => Math.max(max, jsonDepth(item)), 0);
  }
  if (value && typeof value === 'object') {
    return (
      1 + Object.values(value).reduce<number>((max, item) => Math.max(max, jsonDepth(item)), 0)
    );
  }
  return 0;
}

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b, 'en'),
    );
    return Object.fromEntries(entries.map(([key, val]) => [key, sortJsonKeys(val)]));
  }
  return value;
}

export function formatJson(input: string, options: OptionState): DevToolTransform {
  const source = input.trim();
  if (source.length === 0) throw new Error('Girdi boş — biçimlendirilecek JSON yok.');

  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    throw new Error(`Geçersiz JSON: ${(cause as Error).message}`);
  }

  const sortKeys = bool(options, 'sortKeys', false);
  const value = sortKeys ? sortJsonKeys(parsed) : parsed;

  const minify = str(options, 'mode', 'pretty') === 'minify';
  const output = minify
    ? JSON.stringify(value)
    : JSON.stringify(value, null, indentUnit(str(options, 'indent', '2')));

  const notes: string[] = [];
  if (sortKeys) notes.push('Nesne anahtarları A→Z sıralandı.');
  if (minify) notes.push('Tüm boşluklar atıldı (minify).');

  return {
    output,
    notes,
    stats: [
      { label: 'Düğüm', value: String(countJsonNodes(value)) },
      { label: 'Derinlik', value: String(jsonDepth(value)) },
      { label: 'Girdi', value: `${source.length} krkt` },
      { label: 'Çıktı', value: `${output.length} krkt` },
    ],
  };
}

const XML_TOKENS = /<[^>]+>|[^<]+/g;

function isOpeningTag(token: string): boolean {
  return (
    token.startsWith('<') &&
    !token.startsWith('</') &&
    !token.startsWith('<?') &&
    !token.startsWith('<!') &&
    !token.endsWith('/>')
  );
}

function validateXml(input: string): void {
  if (typeof DOMParser === 'undefined') return;
  const doc = new DOMParser().parseFromString(input, 'application/xml');
  const error = doc.querySelector('parsererror');
  if (error) {
    const detail = (error.textContent ?? '').replace(/\s+/g, ' ').trim();
    throw new Error(`Geçersiz XML: ${detail || 'ayrıştırma hatası'}`);
  }
}

export function formatXml(input: string, options: OptionState): DevToolTransform {
  const source = input.trim();
  if (source.length === 0) throw new Error('Girdi boş — biçimlendirilecek XML yok.');

  validateXml(source);

  const collapsed = source.replace(/>\s+</g, '><').trim();
  const minify = str(options, 'mode', 'pretty') === 'minify';

  if (minify) {
    return {
      output: collapsed,
      notes: ['Etiketler arası boşluklar atıldı (minify).'],
      stats: [
        { label: 'Öğe', value: String((collapsed.match(/<(?![/?!])/g) ?? []).length) },
        { label: 'Girdi', value: `${source.length} krkt` },
        { label: 'Çıktı', value: `${collapsed.length} krkt` },
      ],
    };
  }

  const pad = indentUnit(str(options, 'indent', '2'));
  const tokens = collapsed.match(XML_TOKENS) ?? [];
  const lines: string[] = [];
  let depth = 0;
  let maxDepth = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = (tokens[i] ?? '').trim();
    if (token.length === 0) continue;

    if (token.startsWith('</')) {
      depth = Math.max(0, depth - 1);
      lines.push(pad.repeat(depth) + token);
      continue;
    }

    if (isOpeningTag(token)) {
      const next = (tokens[i + 1] ?? '').trim();
      const after = (tokens[i + 2] ?? '').trim();
      if (next.length > 0 && !next.startsWith('<') && after.startsWith('</')) {
        lines.push(pad.repeat(depth) + token + next + after);
        i += 2;
        continue;
      }
      lines.push(pad.repeat(depth) + token);
      depth += 1;
      maxDepth = Math.max(maxDepth, depth);
      continue;
    }

    lines.push(pad.repeat(depth) + token);
  }

  const output = lines.join('\n');
  return {
    output,
    notes: [],
    stats: [
      { label: 'Öğe', value: String((collapsed.match(/<(?![/?!])/g) ?? []).length) },
      { label: 'Derinlik', value: String(maxDepth) },
      { label: 'Girdi', value: `${source.length} krkt` },
      { label: 'Çıktı', value: `${output.length} krkt` },
    ],
  };
}

export function dedupeList(input: string, options: OptionState): DevToolTransform {
  if (input.trim().length === 0) throw new Error('Girdi boş — tekilleştirilecek satır yok.');

  const trim = bool(options, 'trim', true);
  const dropEmpty = bool(options, 'dropEmpty', true);
  const ignoreCase = bool(options, 'ignoreCase', false);

  const prepared = prepareList(input, { trim, dropEmpty, ignoreCase, dedupe: true });
  const ordered = sortItems(prepared.items, str(options, 'sort', 'none'));
  const output = ordered.join('\n');

  const notes: string[] = [];
  if (ignoreCase) notes.push('Karşılaştırma büyük/küçük harf duyarsız yapıldı.');
  if (str(options, 'sort', 'none') !== 'none') notes.push('Sonuç alfabetik sıralandı.');

  return {
    output,
    notes,
    stats: [
      { label: 'Girdi satırı', value: String(prepared.total) },
      { label: 'Benzersiz', value: String(ordered.length) },
      { label: 'Atılan tekrar', value: String(prepared.removedDuplicates) },
      { label: 'Elenen boş', value: String(prepared.removedEmpty) },
    ],
  };
}

function quoteChar(mode: string): string {
  if (mode === 'single') return "'";
  if (mode === 'double') return '"';
  return '';
}

function escapeForQuote(value: string, quote: string): string {
  if (quote.length === 0) return value;
  return value.split(quote).join(quote + quote);
}

function joinWith(mode: string): string {
  if (mode === 'comma') return ',';
  if (mode === 'newline') return '\n';
  if (mode === 'comma-newline') return ',\n';
  return ', ';
}

export function buildSqlList(input: string, options: OptionState): DevToolTransform {
  if (input.trim().length === 0) throw new Error('Girdi boş — listeye çevrilecek satır yok.');

  const dedupe = bool(options, 'dedupe', true);
  const prepared = prepareList(input, {
    trim: bool(options, 'trim', true),
    dropEmpty: true,
    ignoreCase: false,
    dedupe,
  });

  if (prepared.items.length === 0) throw new Error('Geçerli satır kalmadı.');

  const quote = quoteChar(str(options, 'quote', 'single'));
  const prefix = str(options, 'prefix', '');
  const suffix = str(options, 'suffix', '');

  const cells = prepared.items.map(
    (item) => `${prefix}${quote}${escapeForQuote(item, quote)}${quote}${suffix}`,
  );

  const joined = cells.join(joinWith(str(options, 'separator', 'comma-space')));
  const wrap = str(options, 'wrap', 'in');
  const output = wrap === 'in' ? `IN (${joined})` : wrap === 'parens' ? `(${joined})` : joined;

  const notes: string[] = [];
  if (quote.length > 0) notes.push('Satır içi tırnaklar kaçışlandı (ikiye katlandı).');
  if (dedupe && prepared.removedDuplicates > 0) {
    notes.push(`${prepared.removedDuplicates} tekrar eden satır atıldı.`);
  }

  return {
    output,
    notes,
    stats: [
      { label: 'Girdi satırı', value: String(prepared.total) },
      { label: 'Öğe', value: String(cells.length) },
      { label: 'Elenen boş', value: String(prepared.removedEmpty) },
      { label: 'Çıktı', value: `${output.length} krkt` },
    ],
  };
}
