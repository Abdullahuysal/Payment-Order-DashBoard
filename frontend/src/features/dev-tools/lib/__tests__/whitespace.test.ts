import { describe, expect, it } from 'vitest';

import { cleanWhitespace } from '../whitespace';

describe('cleanWhitespace', () => {
  it('trims trailing whitespace by default', () => {
    const result = cleanWhitespace('satir bir   \nson  ', {});
    expect(result.output).toBe('satir bir\nson');
    expect(result.stats.find((stat) => stat.label === 'Değişen satır')?.value).toBe('2');
  });

  it('collapses runs of blank lines to one', () => {
    const result = cleanWhitespace('a\n\n\n\nb', { trimTrailing: false, collapseBlank: true });
    expect(result.output).toBe('a\n\nb');
  });

  it('expands tabs using the selected width', () => {
    const result = cleanWhitespace('\tx', {
      trimTrailing: false,
      tabsToSpaces: true,
      tabWidth: '4',
    });
    expect(result.output).toBe('    x');
  });

  it('strips zero-width characters and counts them', () => {
    const zwsp = String.fromCharCode(0x200b);
    const bom = String.fromCharCode(0xfeff);
    const result = cleanWhitespace(`a${zwsp}b${bom}c`, {
      trimTrailing: false,
      stripZeroWidth: true,
    });
    expect(result.output).toBe('abc');
    expect(result.stats.find((stat) => stat.label === 'Atılan görünmez')?.value).toBe('2');
  });

  it('converts non-breaking spaces when enabled', () => {
    const nbsp = String.fromCharCode(0x00a0);
    const result = cleanWhitespace(`a${nbsp}b`, {
      trimTrailing: false,
      stripZeroWidth: false,
      nbspToSpace: true,
    });
    expect(result.output).toBe('a b');
  });

  it('forces CRLF line endings', () => {
    const result = cleanWhitespace('a\nb', { trimTrailing: false, eol: 'crlf' });
    expect(result.output).toBe('a\r\nb');
  });

  it('throws on empty input', () => {
    expect(() => cleanWhitespace('   ', {})).toThrow(/Girdi boş/);
  });
});
