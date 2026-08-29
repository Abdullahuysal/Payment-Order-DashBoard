import type { AppEnvironment, ApiErrorShape } from '@/types';

import { config, resolveApiBaseUrl } from './config';

export class HttpError extends Error implements ApiErrorShape {
  readonly status: number;
  readonly code?: string;
  readonly url: string;
  readonly body: unknown;

  constructor(params: {
    status: number;
    message: string;
    url: string;
    code?: string | undefined;
    body?: unknown;
  }) {
    super(params.message);
    this.name = 'HttpError';
    this.status = params.status;
    if (params.code !== undefined) this.code = params.code;
    this.url = params.url;
    this.body = params.body;
  }
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

type Interceptors = {
  onRequest?: (ctx: { url: string; init: RequestInit }) => void | Promise<void>;
  onResponse?: (ctx: { url: string; response: Response; durationMs: number }) => void;
  onError?: (error: HttpError) => void;
};

export interface HttpClient {
  get<T>(path: string, opts?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  delete<T>(path: string, opts?: RequestOptions): Promise<T>;
  readonly baseUrl: string;
}

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function combineSignals(a: AbortSignal, b?: AbortSignal): AbortSignal {
  if (!b) return a;
  return AbortSignal.any([a, b]);
}

export function createHttpClient(baseUrl: string, interceptors: Interceptors = {}): HttpClient {
  async function request<T>(
    method: string,
    path: string,
    body: unknown,
    opts: RequestOptions = {},
  ): Promise<T> {
    if (!baseUrl) {
      throw new HttpError({
        status: 0,
        message:
          'Base URL tanımlı değil — .env içindeki VITE_API_BASE_URL_* değerini kontrol edin.',
        url: path,
        code: 'NO_BASE_URL',
      });
    }

    const url = buildUrl(baseUrl, path, opts.query);
    const timeoutMs = opts.timeoutMs ?? config.httpTimeoutMs;
    const timeoutSignal = AbortSignal.timeout(timeoutMs);

    const init: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...opts.headers,
      },
      signal: combineSignals(timeoutSignal, opts.signal),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    await interceptors.onRequest?.({ url, init });

    const startedAt = performance.now();
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (cause) {
      const isTimeout = cause instanceof DOMException && cause.name === 'TimeoutError';
      const err = new HttpError({
        status: 0,
        message: isTimeout
          ? `İstek zaman aşımına uğradı (${timeoutMs} ms)`
          : `Ağ hatası: ${(cause as Error).message}`,
        url,
        code: isTimeout ? 'TIMEOUT' : 'NETWORK',
        body: cause,
      });
      interceptors.onError?.(err);
      throw err;
    }

    const durationMs = performance.now() - startedAt;
    interceptors.onResponse?.({ url, response, durationMs });

    const payload = await parseBody(response);

    if (!response.ok) {
      const err = new HttpError({
        status: response.status,
        message: extractMessage(payload) ?? `${response.status} ${response.statusText}`,
        url,
        code: extractCode(payload),
        body: payload,
      });
      interceptors.onError?.(err);
      throw err;
    }

    return payload as T;
  }

  return {
    baseUrl,
    get: (path, opts) => request('GET', path, undefined, opts),
    post: (path, body, opts) => request('POST', path, body, opts),
    put: (path, body, opts) => request('PUT', path, body, opts),
    patch: (path, body, opts) => request('PATCH', path, body, opts),
    delete: (path, opts) => request('DELETE', path, undefined, opts),
  };
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 204 || !contentType) return null;
  if (contentType.includes('application/json')) {
    return (await response.json()) as unknown;
  }
  return response.text();
}

function extractMessage(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message: unknown = payload.message;
    if (typeof message === 'string') return message;
  }
  return undefined;
}

function extractCode(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object' && 'code' in payload) {
    const code: unknown = payload.code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

const devInterceptors: Interceptors = import.meta.env.DEV
  ? {
      onResponse: ({ url, response, durationMs }) => {
        console.debug(`[http] ${response.status} ${url} (${durationMs.toFixed(0)}ms)`);
      },
      onError: (error) => {
        console.warn(`[http] ${error.code ?? error.status} ${error.url} — ${error.message}`);
      },
    }
  : {};

const clientCache = new Map<AppEnvironment, HttpClient>();

export function apiClientForEnv(env: AppEnvironment): HttpClient {
  let client = clientCache.get(env);
  if (!client) {
    client = createHttpClient(resolveApiBaseUrl(env), devInterceptors);
    clientCache.set(env, client);
  }
  return client;
}
