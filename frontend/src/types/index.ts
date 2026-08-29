export type AppEnvironment = 'dev' | 'preprod' | 'production';

export type Status = 'up' | 'degraded' | 'down' | 'unknown';

export interface ApiErrorShape {
  status: number;
  message: string;
  code?: string;
}

export type Async<T> =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success'; data: T }
  | { state: 'error'; error: ApiErrorShape };
