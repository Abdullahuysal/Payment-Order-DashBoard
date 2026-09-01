import { describe, expect, it } from 'vitest';

import { convertJsonCsv } from '../json-csv';

describe('convertJsonCsv', () => {
  it('converts an object array to CSV with a header row', () => {
    const result = convertJsonCsv('[{"id":1,"ad":"a"},{"id":2,"ad":"b"}]', {
      mode: 'json2csv',
      delimiter: 'comma',
      header: true,
    });
    expect(result.output).toBe('id,ad\n1,a\n2,b');
    expect(result.stats.find((stat) => stat.label === 'Kolon')?.value).toBe('2');
  });

  it('applies RFC4180 quoting when a field contains the delimiter or quotes', () => {
    const result = convertJsonCsv('[{"note":"a,b\\"c"}]', { mode: 'json2csv', header: false });
    expect(result.output).toBe('"a,b""c"');
  });

  it('uses a semicolon delimiter when selected', () => {
    const result = convertJsonCsv('[{"a":1,"b":2}]', {
      mode: 'json2csv',
      delimiter: 'semicolon',
      header: true,
    });
    expect(result.output).toBe('a;b\n1;2');
  });

  it('parses CSV back into an object array', () => {
    const result = convertJsonCsv('id,ad\n1,a\n2,b', {
      mode: 'csv2json',
      delimiter: 'comma',
      header: true,
    });
    expect(JSON.parse(result.output)).toEqual([
      { id: '1', ad: 'a' },
      { id: '2', ad: 'b' },
    ]);
  });

  it('throws when json2csv input is not an array', () => {
    expect(() => convertJsonCsv('{"a":1}', { mode: 'json2csv' })).toThrow(/dizi olmalı/);
  });

  it('throws when an array element is not an object', () => {
    expect(() => convertJsonCsv('[1,2]', { mode: 'json2csv' })).toThrow(/düz bir nesne/);
  });

  it('throws when csv column counts are inconsistent', () => {
    expect(() => convertJsonCsv('a,b\n1,2,3', { mode: 'csv2json', header: true })).toThrow(
      /Kolon sayısı tutarsız/,
    );
  });

  it('throws on empty input', () => {
    expect(() => convertJsonCsv('   ', { mode: 'json2csv' })).toThrow(/Girdi boş/);
  });
});
