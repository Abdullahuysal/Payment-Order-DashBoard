import { describe, expect, it } from 'vitest';

import { convertBase64 } from '../base64';

describe('convertBase64', () => {
  it('encodes UTF-8 text to base64', () => {
    const result = convertBase64('Sipariş 30012345', {
      mode: 'encode',
      urlSafe: false,
      wrap76: false,
    });
    expect(result.output).toBe('U2lwYXJpxZ8gMzAwMTIzNDU=');
  });

  it('round-trips encode then decode', () => {
    const encoded = convertBase64('çğüöşİ', { mode: 'encode' }).output;
    const decoded = convertBase64(encoded, { mode: 'decode' }).output;
    expect(decoded).toBe('çğüöşİ');
  });

  it('produces url-safe output without padding', () => {
    const result = convertBase64('>>>>', { mode: 'encode', urlSafe: true });
    expect(result.output).not.toMatch(/[+/=]/);
  });

  it('wraps encoded output at 76 characters', () => {
    const result = convertBase64('x'.repeat(120), { mode: 'encode', wrap76: true });
    expect(result.output.split('\n').every((line) => line.length <= 76)).toBe(true);
  });

  it('decodes url-safe input regardless of the toggle', () => {
    const result = convertBase64('U2lwYXJpxZ8', { mode: 'decode' });
    expect(result.output).toBe('Sipariş');
  });

  it('throws a Turkish error on invalid base64 when decoding', () => {
    expect(() => convertBase64('%%%not base64%%%', { mode: 'decode' })).toThrow(/Geçersiz base64/);
  });

  it('throws on empty input', () => {
    expect(() => convertBase64('   ', { mode: 'encode' })).toThrow(/Girdi boş/);
  });
});
