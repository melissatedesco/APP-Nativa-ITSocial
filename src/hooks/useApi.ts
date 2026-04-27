import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  fn: (...args: unknown[]) => Promise<T>
): ApiState<T> & { execute: (...args: unknown[]) => Promise<void> } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: unknown[]) => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await fn(...args);
        setState({ data, loading: false, error: null });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Errore sconosciuto';
        setState({ data: null, loading: false, error: message });
      }
    },
    [fn]
  );

  return { ...state, execute };
}
