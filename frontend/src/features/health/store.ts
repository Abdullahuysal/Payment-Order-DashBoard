import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { HealthCheck } from './types';

export type NewHealthCheck = Omit<HealthCheck, 'id' | 'source' | 'createdAt'>;

interface HealthConfigState {
  customChecks: HealthCheck[];
  overrides: Record<string, string>;

  addCustomCheck: (input: NewHealthCheck) => void;
  updateCustomCheck: (id: string, patch: Partial<NewHealthCheck>) => void;
  removeCustomCheck: (id: string) => void;

  setOverride: (checkId: string, alivePath: string) => void;
  clearOverride: (checkId: string) => void;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useHealthConfigStore = create<HealthConfigState>()(
  persist(
    (set) => ({
      customChecks: [],
      overrides: {},

      addCustomCheck: (input) =>
        set((s) => ({
          customChecks: [
            ...s.customChecks,
            { ...input, id: newId(), source: 'custom', createdAt: new Date().toISOString() },
          ],
        })),

      updateCustomCheck: (id, patch) =>
        set((s) => ({
          customChecks: s.customChecks.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeCustomCheck: (id) =>
        set((s) => ({ customChecks: s.customChecks.filter((c) => c.id !== id) })),

      setOverride: (checkId, alivePath) =>
        set((s) => ({ overrides: { ...s.overrides, [checkId]: alivePath } })),

      clearOverride: (checkId) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[checkId];
          return { overrides: next };
        }),
    }),
    { name: 'boyner-ops-health', version: 1 },
  ),
);
