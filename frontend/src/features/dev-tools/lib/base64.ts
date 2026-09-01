import type { DevToolTransform, OptionState } from '../types';
import { readBool, readStr } from './_shared';

function bytesToBinary(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return binary;
}

function binaryToBytes(binary: string): Uint8Array {
  return Uint8Array.from({ length: binary.length }, (_, i) => binary.charCodeAt(i));
}

export function convertBase64(input: string, options: OptionState): DevToolTransform {
  const source = input.replace(/\r\n|\r|\n/g, '');
  if (source.trim().length === 0) throw new Error('Girdi boş — çevrilecek metin yok.');

  const mode = readStr(options, 'mode', 'encode');
  const urlSafe = readBool(options, 'urlSafe', false);
  const wrap76 = readBool(options, 'wrap76', false);

  let output: string;
  const notes: string[] = [];

  if (mode === 'decode') {
    let normalized = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    normalized += '='.repeat((4 - (normalized.length % 4)) % 4);
    let binary: string;
    try {
      binary = atob(normalized);
    } catch {
      throw new Error('Geçersiz base64: girdi çözülemedi.');
    }
    output = new TextDecoder().decode(binaryToBytes(binary));
    notes.push('Base64 çözüldü, UTF-8 metne dönüştürüldü.');
  } else {
    const bytes = new TextEncoder().encode(input);
    let encoded = btoa(bytesToBinary(bytes));
    if (urlSafe) {
      encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      notes.push('URL-güvenli alfabe kullanıldı, dolgu atıldı.');
    }
    if (wrap76) {
      encoded = (encoded.match(/.{1,76}/g) ?? []).join('\n');
      notes.push('Çıktı 76 karakterde bir satıra bölündü.');
    }
    output = encoded;
  }

  return {
    output,
    notes,
    stats: [
      { label: 'Girdi', value: `${input.length} krkt` },
      { label: 'Çıktı', value: `${output.length} krkt` },
    ],
  };
}
