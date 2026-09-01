import {
  Binary,
  Braces,
  CaseSensitive,
  Clock,
  Code,
  CodeXml,
  Database,
  Eraser,
  FoldVertical,
  Hash,
  KeyRound,
  Link2,
  ListX,
  Regex,
  Table,
  Terminal,
  type LucideIcon,
} from 'lucide-react';

import { buildSqlList, dedupeList, formatJson, formatXml } from './lib';
import { convertBase64 } from './lib/base64';
import { convertCase } from './lib/case';
import { convertCurl } from './lib/curl';
import { convertJsonCsv } from './lib/json-csv';
import { convertNumberBase } from './lib/number-base';
import { convertTimestamp } from './lib/timestamp';
import { decodeJwt } from './lib/jwt';
import { flattenJson } from './lib/json-flatten';
import { formatHtml } from './lib/html';
import { parseUrlQuery } from './lib/url';
import { testRegex } from './lib/regex';
import { cleanWhitespace } from './lib/whitespace';
import type { DevToolKey, DevToolTransformFn, OptionState, OutputLanguage } from './types';

export type DevToolGroup = 'json' | 'text' | 'web' | 'data';

export type OptionField =
  | { kind: 'toggle'; key: string; label: string }
  | {
      kind: 'select';
      key: string;
      label: string;
      choices: ReadonlyArray<{ value: string; label: string }>;
    }
  | { kind: 'text'; key: string; label: string; placeholder: string };

export interface DevToolConfig {
  key: DevToolKey;
  label: string;
  icon: LucideIcon;
  summary: string;
  group: DevToolGroup;
  inputLabel: string;
  inputPlaceholder: string;
  sample: string;
  language: OutputLanguage;
  options: readonly OptionField[];
  defaults: OptionState;
  transform: DevToolTransformFn;
  secondaryInput?: { label: string; placeholder: string; sample?: string } | undefined;
}

const indentChoices = [
  { value: '2', label: '2 boşluk' },
  { value: '4', label: '4 boşluk' },
  { value: 'tab', label: 'Tab' },
] as const;

const modeChoices = [
  { value: 'pretty', label: 'Okunur' },
  { value: 'minify', label: 'Küçült' },
] as const;

export const DEV_TOOLS: Record<DevToolKey, DevToolConfig> = {
  json: {
    key: 'json',
    label: 'JSON Biçimlendirici',
    icon: Braces,
    group: 'json',
    summary: 'JSON’ı doğrular; girintiler, anahtarları sıralar ya da tek satıra küçültür.',
    inputLabel: 'Ham JSON',
    inputPlaceholder: '{"id":1,"items":[2,1]}',
    sample: '{"b":2,"a":[3,1,2],"nested":{"y":true,"x":null},"id":"30012345"}',
    language: 'json',
    options: [
      { kind: 'select', key: 'mode', label: 'Biçim', choices: modeChoices },
      { kind: 'select', key: 'indent', label: 'Girinti', choices: indentChoices },
      { kind: 'toggle', key: 'sortKeys', label: 'Anahtarları sırala' },
    ],
    defaults: { mode: 'pretty', indent: '2', sortKeys: false },
    transform: formatJson,
  },
  xml: {
    key: 'xml',
    label: 'XML Biçimlendirici',
    icon: CodeXml,
    group: 'json',
    summary: 'XML’i ayrıştırır; okunur biçimde girintiler ya da tek satıra küçültür.',
    inputLabel: 'Ham XML',
    inputPlaceholder: '<order><line sku="BOY-1" qty="1"/></order>',
    sample:
      '<order id="30012345"><customer>Ayşe Yılmaz</customer><lines><line sku="BOY-1002345" qty="1"/></lines></order>',
    language: 'xml',
    options: [
      { kind: 'select', key: 'mode', label: 'Biçim', choices: modeChoices },
      { kind: 'select', key: 'indent', label: 'Girinti', choices: indentChoices },
    ],
    defaults: { mode: 'pretty', indent: '2' },
    transform: formatXml,
  },
  list: {
    key: 'list',
    label: 'Liste Tekilleştirici',
    icon: ListX,
    group: 'text',
    summary: 'Satır listesindeki tekrarları atar; kırpar, boşları eler, sıralar.',
    inputLabel: 'Satır listesi',
    inputPlaceholder: 'her satıra bir değer',
    sample: '30012345\n30012346\n30012345\n 30012347 \n30012346\n\n30012348',
    language: 'text',
    options: [
      { kind: 'toggle', key: 'trim', label: 'Satırları kırp' },
      { kind: 'toggle', key: 'dropEmpty', label: 'Boş satırları ele' },
      { kind: 'toggle', key: 'ignoreCase', label: 'Harf duyarsız' },
      {
        kind: 'select',
        key: 'sort',
        label: 'Sıralama',
        choices: [
          { value: 'none', label: 'Sıra yok' },
          { value: 'asc', label: 'A→Z' },
          { value: 'desc', label: 'Z→A' },
        ],
      },
    ],
    defaults: { trim: true, dropEmpty: true, ignoreCase: false, sort: 'none' },
    transform: dedupeList,
  },
  'sql-list': {
    key: 'sql-list',
    label: 'SQL Liste Oluşturucu',
    icon: Database,
    group: 'data',
    summary: 'Satırları tırnaklar, önek/sonek ekler, IN (…) için tek ifadede birleştirir.',
    inputLabel: 'Değer listesi',
    inputPlaceholder: 'sorgunun döndürdüğü kimlikler, her satıra bir tane',
    sample: '30012345\n30012346\n30012347\n30012346',
    language: 'sql',
    options: [
      {
        kind: 'select',
        key: 'quote',
        label: 'Tırnak',
        choices: [
          { value: 'single', label: "Tek '" },
          { value: 'double', label: 'Çift "' },
          { value: 'none', label: 'Yok' },
        ],
      },
      { kind: 'text', key: 'prefix', label: 'Önek', placeholder: 'örn. N' },
      { kind: 'text', key: 'suffix', label: 'Sonek', placeholder: 'örn. ::text' },
      {
        kind: 'select',
        key: 'separator',
        label: 'Ayraç',
        choices: [
          { value: 'comma-space', label: ', ' },
          { value: 'comma', label: ',' },
          { value: 'comma-newline', label: ', + satır' },
          { value: 'newline', label: 'satır' },
        ],
      },
      {
        kind: 'select',
        key: 'wrap',
        label: 'Sarma',
        choices: [
          { value: 'in', label: 'IN (…)' },
          { value: 'parens', label: '( … )' },
          { value: 'none', label: 'Yok' },
        ],
      },
      { kind: 'toggle', key: 'trim', label: 'Kırp' },
      { kind: 'toggle', key: 'dedupe', label: 'Tekrarları at' },
    ],
    defaults: {
      quote: 'single',
      prefix: '',
      suffix: '',
      separator: 'comma-space',
      wrap: 'in',
      trim: true,
      dedupe: true,
    },
    transform: buildSqlList,
  },
  jwt: {
    key: 'jwt',
    label: 'JWT Çözücü',
    icon: KeyRound,
    group: 'web',
    summary:
      'JWT’yi üç parçaya böler; header ve payload’ı çözüp okunur JSON gösterir. İmza doğrulamaz.',
    inputLabel: 'JWT metni',
    inputPlaceholder: 'eyJhbGciOi....eyJzdWIiOi....imza',
    sample:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMDAxMjM0NSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAzNjAwfQ.sig',
    language: 'json',
    options: [
      {
        kind: 'select',
        key: 'part',
        label: 'Bölüm',
        choices: [
          { value: 'header', label: 'Header' },
          { value: 'payload', label: 'Payload' },
          { value: 'both', label: 'İkisi' },
        ],
      },
      { kind: 'toggle', key: 'decodeTimes', label: 'Zamanları çöz' },
    ],
    defaults: { part: 'both', decodeTimes: false },
    transform: decodeJwt,
  },
  base64: {
    key: 'base64',
    label: 'Base64 Çevir',
    icon: Binary,
    group: 'text',
    summary: 'Metni UTF-8 base64’e çevirir ya da base64’ü çözer; URL-güvenli ve 76 karakter sarma.',
    inputLabel: 'Girdi',
    inputPlaceholder: 'çevrilecek metin ya da base64',
    sample: 'Sipariş 30012345 onaylandı',
    language: 'text',
    options: [
      {
        kind: 'select',
        key: 'mode',
        label: 'Yön',
        choices: [
          { value: 'encode', label: 'Kodla' },
          { value: 'decode', label: 'Çöz' },
        ],
      },
      { kind: 'toggle', key: 'urlSafe', label: 'URL-güvenli' },
      { kind: 'toggle', key: 'wrap76', label: '76’da sar' },
    ],
    defaults: { mode: 'encode', urlSafe: false, wrap76: false },
    transform: convertBase64,
  },
  url: {
    key: 'url',
    label: 'URL / Query Ayrıştırıcı',
    icon: Link2,
    group: 'web',
    summary: 'Tam URL ya da query string’i parçalara ayırır; satırlardan query string oluşturur.',
    inputLabel: 'URL ya da query',
    inputPlaceholder: 'https://ornek.com/yol?a=1&b=2  ya da  a=1&b=2',
    sample: 'https://ops.boyner.com.tr/orders?status=paid&status=shipped&page=2#detay',
    language: 'json',
    options: [
      {
        kind: 'select',
        key: 'mode',
        label: 'Yön',
        choices: [
          { value: 'parse', label: 'Ayrıştır' },
          { value: 'build', label: 'Oluştur' },
        ],
      },
      {
        kind: 'select',
        key: 'format',
        label: 'Biçim',
        choices: [
          { value: 'json', label: 'JSON' },
          { value: 'table', label: 'Tablo' },
        ],
      },
    ],
    defaults: { mode: 'parse', format: 'json' },
    transform: parseUrlQuery,
  },
  timestamp: {
    key: 'timestamp',
    label: 'Zaman Damgası Çevir',
    icon: Clock,
    group: 'text',
    summary: 'Epoch (s/ms) ve ISO tarihleri birbirine çevirir; yerel saat dilimi ve görece zaman.',
    inputLabel: 'Zaman damgaları',
    inputPlaceholder: 'her satıra bir epoch ya da ISO tarih',
    sample: '1700000000\n1700000000000\n2023-11-14T22:13:20Z',
    language: 'text',
    options: [
      {
        kind: 'select',
        key: 'unit',
        label: 'Birim',
        choices: [
          { value: 'auto', label: 'Oto' },
          { value: 's', label: 'Saniye' },
          { value: 'ms', label: 'ms' },
        ],
      },
      { kind: 'text', key: 'tz', label: 'Saat dilimi', placeholder: 'Europe/Istanbul' },
    ],
    defaults: { unit: 'auto', tz: 'Europe/Istanbul' },
    transform: convertTimestamp,
  },
  case: {
    key: 'case',
    label: 'Kılıf Dönüştürücü',
    icon: CaseSensitive,
    group: 'text',
    summary:
      'Metni kelimelere ayırır ve camel/pascal/snake/kebab/constant/sentence/title kılıfına çevirir.',
    inputLabel: 'Metin',
    inputPlaceholder: 'her satır ayrı dönüştürülür',
    sample: 'orderStatusChanged\nretail invoice-line\nMERCHANT_SHIPMENT',
    language: 'text',
    options: [
      {
        kind: 'select',
        key: 'target',
        label: 'Hedef',
        choices: [
          { value: 'camel', label: 'camelCase' },
          { value: 'pascal', label: 'PascalCase' },
          { value: 'snake', label: 'snake_case' },
          { value: 'kebab', label: 'kebab-case' },
          { value: 'constant', label: 'CONSTANT' },
          { value: 'sentence', label: 'Sentence' },
          { value: 'title', label: 'Title Case' },
        ],
      },
    ],
    defaults: { target: 'camel' },
    transform: convertCase,
  },
  whitespace: {
    key: 'whitespace',
    label: 'Boşluk / Görünmez Temizleyici',
    icon: Eraser,
    group: 'text',
    summary:
      'Sondaki boşlukları kırpar, boş satırları teke indirir, tab’ları ve görünmez karakterleri temizler.',
    inputLabel: 'Metin',
    inputPlaceholder: 'temizlenecek metni yapıştır',
    sample: 'satır bir   \n\n\n\tsekmeyle başlayan\nson satır ',
    language: 'text',
    options: [
      { kind: 'toggle', key: 'trimTrailing', label: 'Sondaki boşluk' },
      { kind: 'toggle', key: 'collapseBlank', label: 'Boş satır teke' },
      { kind: 'toggle', key: 'tabsToSpaces', label: 'Tab → boşluk' },
      {
        kind: 'select',
        key: 'tabWidth',
        label: 'Tab eni',
        choices: [
          { value: '2', label: '2' },
          { value: '4', label: '4' },
        ],
      },
      { kind: 'toggle', key: 'stripZeroWidth', label: 'Sıfır genişlik' },
      { kind: 'toggle', key: 'nbspToSpace', label: 'NBSP → boşluk' },
      {
        kind: 'select',
        key: 'eol',
        label: 'Satır sonu',
        choices: [
          { value: 'keep', label: 'Koru' },
          { value: 'lf', label: 'LF' },
          { value: 'crlf', label: 'CRLF' },
        ],
      },
    ],
    defaults: {
      trimTrailing: true,
      collapseBlank: false,
      tabsToSpaces: false,
      tabWidth: '2',
      stripZeroWidth: true,
      nbspToSpace: false,
      eol: 'keep',
    },
    transform: cleanWhitespace,
  },
  'json-flatten': {
    key: 'json-flatten',
    label: 'JSON Düzleştir / Aç',
    icon: FoldVertical,
    group: 'json',
    summary: 'İç içe JSON’ı tek seviyeli `a.b.c` anahtarlara düzleştirir ya da tersine açar.',
    inputLabel: 'JSON',
    inputPlaceholder: '{"a":{"b":{"c":1}}}',
    sample: '{"order":{"id":"30012345","lines":[{"sku":"BOY-1","qty":2}]}}',
    language: 'json',
    options: [
      {
        kind: 'select',
        key: 'mode',
        label: 'Yön',
        choices: [
          { value: 'flatten', label: 'Düzleştir' },
          { value: 'unflatten', label: 'Aç' },
        ],
      },
      { kind: 'text', key: 'delimiter', label: 'Ayraç', placeholder: '.' },
      { kind: 'toggle', key: 'arrayIndices', label: 'Dizi indeksi' },
    ],
    defaults: { mode: 'flatten', delimiter: '.', arrayIndices: true },
    transform: flattenJson,
  },
  'json-csv': {
    key: 'json-csv',
    label: 'JSON ↔ CSV',
    icon: Table,
    group: 'data',
    summary:
      'Düz nesne dizisini CSV’ye çevirir ya da CSV’yi nesne dizisine döndürür (RFC4180 kaçış).',
    inputLabel: 'JSON dizisi ya da CSV',
    inputPlaceholder: '[{"id":1,"ad":"a"}]  ya da  id,ad / 1,a',
    sample:
      '[{"id":"30012345","tutar":149.9,"durum":"paid"},{"id":"30012346","tutar":89,"durum":"shipped"}]',
    language: 'text',
    options: [
      {
        kind: 'select',
        key: 'mode',
        label: 'Yön',
        choices: [
          { value: 'json2csv', label: 'JSON → CSV' },
          { value: 'csv2json', label: 'CSV → JSON' },
        ],
      },
      {
        kind: 'select',
        key: 'delimiter',
        label: 'Ayraç',
        choices: [
          { value: 'comma', label: ',' },
          { value: 'semicolon', label: ';' },
          { value: 'tab', label: 'Tab' },
        ],
      },
      { kind: 'toggle', key: 'header', label: 'Başlık satırı' },
    ],
    defaults: { mode: 'json2csv', delimiter: 'comma', header: true },
    transform: convertJsonCsv,
  },
  curl: {
    key: 'curl',
    label: 'cURL Ayrıştır / Oluştur',
    icon: Terminal,
    group: 'web',
    summary:
      'cURL komutunu `{ method, url, headers, body }` yapıya ayrıştırır ya da yapıdan komut üretir.',
    inputLabel: 'cURL komutu ya da JSON',
    inputPlaceholder: "curl -X POST 'https://...' -H 'Accept: application/json' --data '{}'",
    sample:
      "curl -X POST 'https://ops.boyner.com.tr/api/orders' -H 'Content-Type: application/json' -H 'X-Environment: test' --data '{\"id\":\"30012345\"}'",
    language: 'json',
    options: [
      {
        kind: 'select',
        key: 'mode',
        label: 'Yön',
        choices: [
          { value: 'parse', label: 'Ayrıştır' },
          { value: 'build', label: 'Oluştur' },
        ],
      },
    ],
    defaults: { mode: 'parse' },
    transform: convertCurl,
  },
  regex: {
    key: 'regex',
    label: 'Regex Test',
    icon: Regex,
    group: 'text',
    summary: 'Deseni girdi metnine uygular; eşleşmeleri listeler, değiştirir ya da metni böler.',
    inputLabel: 'Hedef metin',
    inputPlaceholder: 'desenin uygulanacağı metin',
    sample: 'sipariş 30012345, sipariş 30012346 ve sipariş 30012347 oluşturuldu',
    language: 'text',
    options: [
      { kind: 'text', key: 'pattern', label: 'Desen', placeholder: '\\d{8}' },
      { kind: 'text', key: 'flags', label: 'Bayraklar', placeholder: 'g' },
      {
        kind: 'select',
        key: 'action',
        label: 'İşlem',
        choices: [
          { value: 'match', label: 'Eşleştir' },
          { value: 'replace', label: 'Değiştir' },
          { value: 'split', label: 'Böl' },
        ],
      },
      { kind: 'text', key: 'replacement', label: 'Değişim', placeholder: '#$&' },
    ],
    defaults: { pattern: '', flags: 'g', action: 'match', replacement: '' },
    transform: testRegex,
  },
  'number-base': {
    key: 'number-base',
    label: 'Sayı Tabanı Çevir',
    icon: Hash,
    group: 'text',
    summary:
      'Satır satır tamsayıları 2/8/10/16 tabanları arasında çevirir (BigInt); hepsini birden gösterir.',
    inputLabel: 'Sayılar',
    inputPlaceholder: 'her satıra bir tamsayı',
    sample: '255\n0xff\n0b1010\n0o17',
    language: 'text',
    options: [
      {
        kind: 'select',
        key: 'from',
        label: 'Kaynak',
        choices: [
          { value: 'auto', label: 'Oto' },
          { value: '2', label: '2' },
          { value: '8', label: '8' },
          { value: '10', label: '10' },
          { value: '16', label: '16' },
        ],
      },
      {
        kind: 'select',
        key: 'to',
        label: 'Hedef',
        choices: [
          { value: '2', label: '2' },
          { value: '8', label: '8' },
          { value: '10', label: '10' },
          { value: '16', label: '16' },
        ],
      },
      { kind: 'toggle', key: 'showAll', label: 'Hepsini göster' },
    ],
    defaults: { from: 'auto', to: '10', showAll: false },
    transform: convertNumberBase,
  },
  html: {
    key: 'html',
    label: 'HTML Küçült / Biçimle',
    icon: Code,
    group: 'json',
    summary:
      'HTML’i okunur biçimde girintiler ya da tek satıra küçültür; void ve raw element’lere dikkat eder.',
    inputLabel: 'Ham HTML',
    inputPlaceholder: '<div><p>merhaba</p></div>',
    sample: '<div class="card"><img src="a.png"><p>Sipariş <b>30012345</b></p><!-- not --></div>',
    language: 'xml',
    options: [
      { kind: 'select', key: 'mode', label: 'Biçim', choices: modeChoices },
      { kind: 'select', key: 'indent', label: 'Girinti', choices: indentChoices },
      { kind: 'toggle', key: 'removeComments', label: 'Yorumları sil' },
    ],
    defaults: { mode: 'pretty', indent: '2', removeComments: false },
    transform: formatHtml,
  },
};

export const DEV_TOOL_LIST: readonly DevToolConfig[] = Object.values(DEV_TOOLS);

export const DEV_TOOL_GROUPS: ReadonlyArray<{ group: DevToolGroup; label: string }> = [
  { group: 'json', label: 'JSON & Biçimleme' },
  { group: 'text', label: 'Metin' },
  { group: 'web', label: 'Web' },
  { group: 'data', label: 'Veri' },
];

export function getDevTool(key: string | undefined): DevToolConfig | undefined {
  if (!key) return undefined;
  return DEV_TOOLS[key as DevToolKey];
}
