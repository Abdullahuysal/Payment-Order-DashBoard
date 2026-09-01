import { describe, expect, it } from 'vitest';

import { convertCurl } from '../curl';

describe('convertCurl', () => {
  it('parses a curl command into a structured object', () => {
    const result = convertCurl(
      "curl -X POST 'https://api.example.com/orders' -H 'Content-Type: application/json' --data '{\"id\":1}'",
      { mode: 'parse' },
    );
    const parsed = JSON.parse(result.output) as {
      method: string;
      url: string;
      headers: Record<string, string>;
      body: string;
    };
    expect(parsed.method).toBe('POST');
    expect(parsed.url).toBe('https://api.example.com/orders');
    expect(parsed.headers['Content-Type']).toBe('application/json');
    expect(parsed.body).toBe('{"id":1}');
    expect(result.stats.find((stat) => stat.label === 'Header')?.value).toBe('1');
  });

  it('handles backslash line continuations and defaults method to GET', () => {
    const result = convertCurl("curl \\\n  'https://api.example.com/health'", { mode: 'parse' });
    const parsed = JSON.parse(result.output) as { method: string; url: string };
    expect(parsed.method).toBe('GET');
    expect(parsed.url).toBe('https://api.example.com/health');
  });

  it('builds a single-line curl command from a structured object', () => {
    const result = convertCurl(
      JSON.stringify({
        method: 'post',
        url: 'https://api.example.com/orders',
        headers: { Accept: 'application/json' },
        body: '{}',
      }),
      { mode: 'build' },
    );
    expect(result.output).toBe(
      "curl -X POST 'https://api.example.com/orders' -H 'Accept: application/json' --data '{}'",
    );
  });

  it('throws when parse input does not start with curl', () => {
    expect(() => convertCurl("wget 'https://x'", { mode: 'parse' })).toThrow(
      /`curl` ile başlamıyor/,
    );
  });

  it('throws a Turkish error when build input is invalid JSON', () => {
    expect(() => convertCurl('{nope}', { mode: 'build' })).toThrow(/Geçersiz JSON/);
  });

  it('throws on empty input', () => {
    expect(() => convertCurl('   ', { mode: 'parse' })).toThrow(/Girdi boş/);
  });
});
