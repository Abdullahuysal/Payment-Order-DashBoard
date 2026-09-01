export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const LOG_LEVELS: readonly LogLevel[] = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
] as const;

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  logger?: string | undefined;
  traceId?: string | undefined;
  spanId?: string | undefined;
  orderId?: string | undefined;
  exceptionType?: string | undefined;
  stackTrace?: string | undefined;
  fields?: Record<string, unknown> | undefined;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface LevelCount {
  level: LogLevel;
  count: number;
}

export interface ServiceCount {
  service: string;
  count: number;
}

export interface HistogramBucket {
  startTime: string;
  count: number;
  byLevel?: Partial<Record<LogLevel, number>> | undefined;
}

export interface LogFacets {
  byLevel: LevelCount[];
  byService: ServiceCount[];
  histogram: HistogramBucket[];
}

export type TimeRangePreset = '15m' | '1h' | '24h' | 'custom';

export interface LogSearchParams {
  q?: string | undefined;
  levels?: LogLevel[] | undefined;
  service?: string | undefined;
  traceId?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface LogSearchResponse extends PagedResponse<LogEntry> {
  facets: LogFacets;
}

export interface ExceptionGroup {
  fingerprint: string;
  exceptionType: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  services: string[];
  sampleTraceId?: string | undefined;
  sampleStackTrace?: string | undefined;
}

export interface ExceptionParams {
  from?: string | undefined;
  to?: string | undefined;
  service?: string | undefined;
}

export type AiConfidence = 'low' | 'medium' | 'high';

export interface AiSummaryGroup {
  title: string;
  rootCauseGuess: string;
  impact: string;
  suggestedAction: string;
  confidence: AiConfidence;
  relatedTraceIds?: string[] | undefined;
}

export interface AiSummary {
  headline: string;
  groups: AiSummaryGroup[];
  modelUsed: string;
  generatedAt: string;
  cached: boolean;
}

export interface AiSummaryRequest {
  from?: string | undefined;
  to?: string | undefined;
  orderId?: string | undefined;
  traceId?: string | undefined;
  force?: boolean | undefined;
}

export interface SavedQuery {
  id: string;
  name: string;
  params: LogSearchParams;
  createdAt: string;
}
