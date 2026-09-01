import { describe, expect, it } from 'vitest';

import { testRegex } from '../regex';

describe('testRegex', () => {
  it('lists every match and counts them', () => {
    const result = testRegex('sipariş 30012345 ve 30012346', {
      pattern: '\\d{8}',
      flags: 'g',
      action: 'match',
    });
    expect(result.stats.find((stat) => stat.label === 'Eşleşme')?.value).toBe('2');
    expect(result.output).toContain('30012345');
    expect(result.output).toContain('30012346');
  });

  it('replaces matches with group references', () => {
    const result = testRegex('order-1 order-2', {
      pattern: 'order-(\\d)',
      flags: 'g',
      action: 'replace',
      replacement: '#$1',
    });
    expect(result.output).toBe('#1 #2');
    expect(result.stats.find((stat) => stat.label === 'Eşleşme')?.value).toBe('2');
  });

  it('splits the text by the pattern', () => {
    const result = testRegex('a1b2c', { pattern: '\\d', flags: 'g', action: 'split' });
    expect(result.output).toBe('a\nb\nc');
  });

  it('throws when the pattern is empty', () => {
    expect(() => testRegex('abc', { pattern: '', action: 'match' })).toThrow(/Desen boş/);
  });

  it('wraps an invalid regex error in Turkish', () => {
    expect(() => testRegex('abc', { pattern: '(', action: 'match' })).toThrow(/Geçersiz regex/);
  });

  it('throws on empty input', () => {
    expect(() => testRegex('   ', { pattern: '\\d', action: 'match' })).toThrow(/Girdi boş/);
  });
});
