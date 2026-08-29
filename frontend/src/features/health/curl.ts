export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string | undefined;
}

export type CurlParseResult = { ok: true; value: ParsedCurl } | { ok: false; error: string };

export function tokenizeShell(input: string): string[] {
  const tokens: string[] = [];
  let buf = '';
  let quote: '"' | "'" | null = null;
  let has = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;

    if (quote) {
      if (ch === quote) {
        quote = null;
      } else if (ch === '\\' && quote === '"' && i + 1 < input.length) {
        buf += input[++i];
      } else {
        buf += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
      continue;
    }
    if (ch === '\\') {
      const next = input[i + 1];
      if (next === '\n') {
        i++;
      } else if (next === '\r' && input[i + 2] === '\n') {
        i += 2;
      } else if (next !== undefined) {
        buf += next;
        i++;
      }
      continue;
    }
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (has) {
        tokens.push(buf);
        buf = '';
        has = false;
      }
      continue;
    }

    buf += ch;
    has = true;
  }

  if (has) tokens.push(buf);
  return tokens;
}

const VALUE_FLAGS_IGNORED = new Set([
  '--connect-timeout',
  '--max-time',
  '-m',
  '--retry',
  '--resolve',
  '--cacert',
  '--cert',
  '--key',
  '-o',
  '--output',
  '-w',
  '--write-out',
  '--proto',
  '--tlsv1.2',
]);

export function parseCurl(raw: string): CurlParseResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: 'Boş.' };

  const tokens = tokenizeShell(text);
  if (tokens.length === 0) return { ok: false, error: 'Komut çözümlenemedi.' };
  if (tokens[0] === 'curl') tokens.shift();

  const headers: Record<string, string> = {};
  let method = '';
  let url = '';
  let body: string | undefined;

  const dataFlags = new Set([
    '-d',
    '--data',
    '--data-raw',
    '--data-ascii',
    '--data-binary',
    '--data-urlencode',
  ]);

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!;
    const next = (): string => tokens[++i] ?? '';

    if (tok === '-X' || tok === '--request') {
      method = next().toUpperCase();
    } else if (tok.startsWith('-X') && tok.length > 2) {
      method = tok.slice(2).toUpperCase();
    } else if (tok === '--url') {
      url = next();
    } else if (tok === '-H' || tok === '--header') {
      const h = next();
      const idx = h.indexOf(':');
      if (idx > 0) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
    } else if (dataFlags.has(tok)) {
      const d = next();
      body = body ? `${body}&${d}` : d;
    } else if (tok === '--json') {
      body = next();
      headers['Content-Type'] ??= 'application/json';
      headers['Accept'] ??= 'application/json';
    } else if (tok === '-u' || tok === '--user') {
      headers['Authorization'] = `Basic ${btoa(next())}`;
    } else if (tok === '-A' || tok === '--user-agent') {
      headers['User-Agent'] = next();
    } else if (tok === '-e' || tok === '--referer') {
      headers['Referer'] = next();
    } else if (tok === '-b' || tok === '--cookie') {
      headers['Cookie'] = next();
    } else if (VALUE_FLAGS_IGNORED.has(tok)) {
      next();
    } else if (!tok.startsWith('-') && !url) {
      url = tok;
    }
  }

  if (!url) return { ok: false, error: 'URL bulunamadı.' };
  url = url.replace(/^['"]|['"]$/g, '');

  try {
    new URL(url);
  } catch {
    return { ok: false, error: `Geçersiz URL: ${url}` };
  }

  if (!method) method = body !== undefined ? 'POST' : 'GET';

  return { ok: true, value: { method, url, headers, body } };
}

export function deriveNameFromUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const seg = u.pathname.split('/').filter(Boolean)[0];
    return seg ? `${u.hostname} /${seg}` : u.hostname;
  } catch {
    return rawUrl.slice(0, 40);
  }
}
