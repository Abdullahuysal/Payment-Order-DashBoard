import { describe, expect, it } from 'vitest';

import { flattenJson } from '../json-flatten';

describe('flattenJson', () => {
  it('flattens nested objects into dotted keys', () => {
    const result = flattenJson('{"a":{"b":{"c":1}}}', { mode: 'flatten' });
    expect(JSON.parse(result.output)).toEqual({ 'a.b.c': 1 });
    expect(result.stats.find((stat) => stat.label === 'Anahtar')?.value).toBe('1');
    expect(result.stats.find((stat) => stat.label === 'Derinlik')?.value).toBe('3');
  });

  it('flattens array indices when the toggle is on', () => {
    const result = flattenJson('{"lines":[{"sku":"BOY-1"}]}', {
      mode: 'flatten',
      arrayIndices: true,
    });
    expect(JSON.parse(result.output)).toEqual({ 'lines.0.sku': 'BOY-1' });
  });

  it('keeps arrays intact when arrayIndices is off', () => {
    const result = flattenJson('{"tags":[1,2]}', { mode: 'flatten', arrayIndices: false });
    expect(JSON.parse(result.output)).toEqual({ tags: [1, 2] });
  });

  it('unflattens dotted keys back into nested structure', () => {
    const result = flattenJson('{"a.b.c":1,"a.d":2}', { mode: 'unflatten' });
    expect(JSON.parse(result.output)).toEqual({ a: { b: { c: 1 }, d: 2 } });
  });

  it('rebuilds arrays from numeric segments on unflatten', () => {
    const result = flattenJson('{"lines.0.sku":"BOY-1","lines.1.sku":"BOY-2"}', {
      mode: 'unflatten',
    });
    expect(JSON.parse(result.output)).toEqual({ lines: [{ sku: 'BOY-1' }, { sku: 'BOY-2' }] });
  });

  it('honors a custom delimiter', () => {
    const result = flattenJson('{"a":{"b":1}}', { mode: 'flatten', delimiter: '/' });
    expect(JSON.parse(result.output)).toEqual({ 'a/b': 1 });
  });

  it('throws a Turkish error on invalid JSON', () => {
    expect(() => flattenJson('{nope}', { mode: 'flatten' })).toThrow(/Geçersiz JSON/);
  });

  it('throws on empty input', () => {
    expect(() => flattenJson('   ', { mode: 'flatten' })).toThrow(/Girdi boş/);
  });
});
