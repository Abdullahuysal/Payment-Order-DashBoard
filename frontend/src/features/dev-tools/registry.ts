import { Braces, CodeXml, Database, ListX, type LucideIcon } from 'lucide-react';

import { buildSqlList, dedupeList, formatJson, formatXml } from './lib';
import type { DevToolKey, DevToolTransform, OptionState, OutputLanguage } from './types';

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
  inputLabel: string;
  inputPlaceholder: string;
  sample: string;
  language: OutputLanguage;
  options: readonly OptionField[];
  defaults: OptionState;
  transform: (input: string, options: OptionState) => DevToolTransform;
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
};

export const DEV_TOOL_LIST: readonly DevToolConfig[] = Object.values(DEV_TOOLS);

export function getDevTool(key: string | undefined): DevToolConfig | undefined {
  if (!key) return undefined;
  return DEV_TOOLS[key as DevToolKey];
}
