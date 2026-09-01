import { describe, expect, it } from 'vitest';

import { convertTimestamp } from '../timestamp';

describe('convertTimestamp', () => {
  it('converts a seconds epoch to UTC ISO', () => {
    const result = convertTimestamp('1700000000', { unit: 'auto', tz: 'Europe/Istanbul' });
    expect(result.output).toContain('utc=2023-11-14T22:13:20.000Z');
    expect(result.stats.find((stat) => stat.label === 'tz')?.value).toBe('Europe/Istanbul');
  });

  it('treats a 13-digit value as milliseconds under auto', () => {
    const result = convertTimestamp('1700000000000', { unit: 'auto' });
    expect(result.output).toContain('utc=2023-11-14T22:13:20.000Z');
  });

  it('honors an explicit ms unit', () => {
    const result = convertTimestamp('1700000000000', { unit: 'ms' });
    expect(result.output).toContain('2023-11-14T22:13:20.000Z');
  });

  it('converts an ISO date to epoch seconds and milliseconds', () => {
    const result = convertTimestamp('2023-11-14T22:13:20Z', { unit: 'auto' });
    expect(result.output).toContain('epoch_s=1700000000');
    expect(result.output).toContain('epoch_ms=1700000000000');
  });

  it('falls back to UTC and notes an invalid time zone', () => {
    const result = convertTimestamp('1700000000', { unit: 's', tz: 'Mars/Olympus' });
    expect(result.stats.find((stat) => stat.label === 'tz')?.value).toBe('UTC');
    expect(result.notes.some((note) => note.includes('Geçersiz saat dilimi'))).toBe(true);
  });

  it('throws when no line can be resolved', () => {
    expect(() => convertTimestamp('merhaba\ndünya', { unit: 'auto' })).toThrow(/çözülemedi/);
  });

  it('throws on empty input', () => {
    expect(() => convertTimestamp('   ', {})).toThrow(/Girdi boş/);
  });
});
