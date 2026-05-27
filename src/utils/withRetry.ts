import axios from 'axios';

export interface RetryOptions {
  maxAttempts?: number; // default 3 (tentativo iniziale + 2 retry)
  baseDelayMs?: number; // default 1000 → backoff: 1s, 2s
}

function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Esegue `fn` con retry esponenziale su errori di rete.
 * Rilancia immediatamente per qualsiasi altro tipo di errore (4xx, 5xx, etc.).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelayMs = 1000 }: RetryOptions = {}
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt || !isNetworkError(err)) throw err;
      await sleep(baseDelayMs * 2 ** (attempt - 1)); // 1000ms, 2000ms
    }
  }
  // Irraggiungibile — soddisfa il type checker
  throw new Error('withRetry: unexpected exit');
}
