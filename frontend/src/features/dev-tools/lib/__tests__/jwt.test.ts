import { describe, expect, it } from 'vitest';

import { decodeJwt } from '../jwt';

const enc = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString('base64url');

const token = `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({
  sub: '30012345',
  iat: 1700000000,
  exp: 1700003600,
})}.signature`;

describe('decodeJwt', () => {
  it('decodes header and payload as combined object by default', () => {
    const result = decodeJwt(token, { part: 'both', decodeTimes: false });
    const parsed = JSON.parse(result.output) as { header: unknown; payload: unknown };
    expect(parsed.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(parsed.payload).toMatchObject({ sub: '30012345' });
    expect(result.stats.find((stat) => stat.label === 'alg')?.value).toBe('HS256');
  });

  it('returns only the payload when part=payload', () => {
    const result = decodeJwt(token, { part: 'payload', decodeTimes: false });
    expect(JSON.parse(result.output)).toMatchObject({ sub: '30012345' });
  });

  it('adds ISO time notes when decodeTimes is on', () => {
    const result = decodeJwt(token, { part: 'payload', decodeTimes: true });
    expect(result.notes.some((note) => note.startsWith('exp: 2023-11-14'))).toBe(true);
    expect(result.stats.find((stat) => stat.label === 'Süre')?.value).toBe('doldu');
  });

  it('throws a Turkish error when the token does not have three parts', () => {
    expect(() => decodeJwt('a.b', {})).toThrow(/üç bölümden oluşmalı/);
  });

  it('throws a Turkish error on invalid base64/JSON segments', () => {
    expect(() => decodeJwt('!!!.!!!.sig', {})).toThrow(/Geçersiz (base64|JSON)/);
  });

  it('throws on empty input', () => {
    expect(() => decodeJwt('   ', {})).toThrow(/Girdi boş/);
  });
});
