import { describe, expect, it } from 'vitest';

import { parseUrlQuery } from '../url';

describe('parseUrlQuery', () => {
  it('parses a full URL into its parts with duplicate keys as arrays', () => {
    const result = parseUrlQuery(
      'https://ops.example.com/orders?status=paid&status=shipped&page=2#detay',
      { mode: 'parse', format: 'json' },
    );
    const parsed = JSON.parse(result.output) as {
      protocol: string;
      host: string;
      query: Record<string, unknown>;
      hash: string;
    };
    expect(parsed.protocol).toBe('https');
    expect(parsed.host).toBe('ops.example.com');
    expect(parsed.query['status']).toEqual(['paid', 'shipped']);
    expect(parsed.hash).toBe('detay');
    expect(result.stats.find((stat) => stat.label === 'Parametre')?.value).toBe('3');
  });

  it('parses a bare query string', () => {
    const result = parseUrlQuery('a=1&b=2', { mode: 'parse', format: 'json' });
    expect(JSON.parse(result.output)).toEqual({ a: '1', b: '2' });
  });

  it('renders an aligned table when format=table', () => {
    const result = parseUrlQuery('a=1&bb=2', { mode: 'parse', format: 'table' });
    expect(result.output).toContain('a');
    expect(result.output).toContain('bb');
  });

  it('builds an encoded query string from key=value lines', () => {
    const result = parseUrlQuery('q=iki kelime\npage=2', { mode: 'build', format: 'json' });
    expect(result.output).toBe('q=iki+kelime&page=2');
    expect(result.stats.find((stat) => stat.label === 'Parametre')?.value).toBe('2');
  });

  it('throws a Turkish error on an invalid URL for parse', () => {
    expect(() => parseUrlQuery('http://', { mode: 'parse' })).toThrow(/Geçersiz URL/);
  });

  it('throws on empty input', () => {
    expect(() => parseUrlQuery('   ', { mode: 'parse' })).toThrow(/Girdi boş/);
  });
});
