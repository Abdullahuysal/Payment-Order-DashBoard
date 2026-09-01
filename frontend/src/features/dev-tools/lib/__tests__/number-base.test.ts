import { describe, expect, it } from 'vitest';

import { convertNumberBase } from '../number-base';

const lineFor = (output: string, prefix: string): string =>
  output.split('\n').find((line) => line.startsWith(prefix)) ?? '';

describe('convertNumberBase', () => {
  it('auto-detects the source base from the prefix and converts to decimal', () => {
    const result = convertNumberBase('0xff\n0b1010\n0o17\n255', { from: 'auto', to: '10' });
    expect(lineFor(result.output, '0xff')).toMatch(/0xff\s+255$/);
    expect(lineFor(result.output, '0b1010')).toMatch(/0b1010\s+10$/);
    expect(lineFor(result.output, '0o17')).toMatch(/0o17\s+15$/);
    expect(result.stats.find((stat) => stat.label === 'Satır')?.value).toBe('4');
  });

  it('converts from an explicit source base to hex', () => {
    const result = convertNumberBase('1010', { from: '2', to: '16' });
    expect(result.output.trim()).toBe('1010  a');
  });

  it('shows every base when showAll is on', () => {
    const result = convertNumberBase('255', { from: 'auto', showAll: true });
    expect(result.output).toContain('bin=11111111');
    expect(result.output).toContain('oct=377');
    expect(result.output).toContain('dec=255');
    expect(result.output).toContain('hex=ff');
  });

  it('handles very large integers via BigInt', () => {
    const big = '123456789012345678901234567890';
    const result = convertNumberBase(big, { from: '10', to: '16' });
    expect(result.output).toContain(BigInt(big).toString(16));
  });

  it('throws a Turkish error on an invalid digit', () => {
    expect(() => convertNumberBase('12x', { from: '10', to: '2' })).toThrow(/Geçersiz basamak/);
  });

  it('throws on empty input', () => {
    expect(() => convertNumberBase('   ', { from: 'auto' })).toThrow(/Girdi boş/);
  });
});
