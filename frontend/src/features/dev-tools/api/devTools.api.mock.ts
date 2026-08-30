import { HttpError } from '@/services/http';

import { getDevTool } from '../registry';
import type { DevToolRunResult } from '../types';
import type { DevToolsApi } from './devTools.api';

function latency<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function invalidInput(message: string): HttpError {
  return new HttpError({
    status: 422,
    message,
    url: '/api/v1/dev-tools',
    code: 'INVALID_INPUT',
  });
}

export const mockDevToolsApi: DevToolsApi = {
  run(key, request) {
    const tool = getDevTool(key);
    if (!tool) return Promise.reject(invalidInput(`Bilinmeyen araç: ${key}`));

    try {
      const result = tool.transform(request.input, { ...tool.defaults, ...request.options });
      const payload: DevToolRunResult = { ...result, language: tool.language };
      return latency(payload);
    } catch (cause) {
      return Promise.reject(invalidInput((cause as Error).message));
    }
  },
};
