import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { devToolsApi } from '../api/devTools.api';
import type { DevToolKey, DevToolRunRequest, DevToolRunResult } from '../types';

export function useDevToolRunner(
  key: DevToolKey,
): UseMutationResult<DevToolRunResult, Error, DevToolRunRequest> {
  return useMutation({
    mutationKey: ['dev-tools', key],
    mutationFn: (request: DevToolRunRequest) => devToolsApi.run(key, request),
  });
}
