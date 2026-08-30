export type DevToolKey = 'json' | 'xml' | 'list' | 'sql-list';

export type OutputLanguage = 'json' | 'xml' | 'sql' | 'text';

export type OptionValue = string | number | boolean;

export type OptionState = Record<string, OptionValue>;

export interface DevToolRunRequest {
  input: string;
  options: OptionState;
}

export interface DevToolStat {
  label: string;
  value: string;
}

export interface DevToolRunResult {
  output: string;
  language: OutputLanguage;
  stats: DevToolStat[];
  notes: string[];
}

export interface DevToolTransform {
  output: string;
  stats: DevToolStat[];
  notes: string[];
}
