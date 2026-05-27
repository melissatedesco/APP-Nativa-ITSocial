import axios from 'axios';
import { withRetry } from '../../utils/withRetry';

jest.useFakeTimers();

function networkError(): Error {
  const err = new axios.AxiosError('Network Error');
  Object.defineProperty(err, 'response', { value: undefined, writable: true });
  return err;
}

function serverError(status = 500): Error {
  const err = new axios.AxiosError('Server Error');
  Object.defineProperty(err, 'response', { value: { status, data: {} }, writable: true });
  return err;
}

describe('withRetry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('restituisce il risultato se la prima chiamata ha successo', async () => {
    const fn = jest.fn().mockResolvedValue('ok');

    const result = await withRetry(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('riprova dopo un errore di rete e restituisce il risultato al secondo tentativo', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce('ok dopo retry');

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 100 });

    await jest.runAllTimersAsync();

    expect(await promise).toBe('ok dopo retry');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('esaurisce tutti i tentativi e rilancia l\'errore di rete', async () => {
    const fn = jest.fn().mockRejectedValue(networkError());

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 100 });
    // Aggancia il handler PRIMA di avanzare i timer per evitare unhandled rejection
    const assertion = expect(promise).rejects.toThrow('Network Error');

    await jest.runAllTimersAsync();
    await assertion;

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('non riprova su errori 4xx/5xx (non di rete)', async () => {
    const err = serverError(500);
    const fn = jest.fn().mockRejectedValue(err);

    await expect(withRetry(fn)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('non riprova su errori 401', async () => {
    const err = serverError(401);
    const fn = jest.fn().mockRejectedValue(err);

    await expect(withRetry(fn)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('non riprova su errori non-Axios', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Errore generico'));

    await expect(withRetry(fn)).rejects.toThrow('Errore generico');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('usa il backoff esponenziale tra i tentativi', async () => {
    const fn = jest.fn().mockRejectedValue(networkError());
    const baseDelayMs = 500;

    // Aggancia subito .catch() per evitare unhandled rejection quando esaurisce
    withRetry(fn, { maxAttempts: 3, baseDelayMs }).catch(() => {});

    // Tentativo 1 avviene subito; sleep successivo = 500ms (2^0 * 500)
    expect(fn).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(baseDelayMs);
    expect(fn).toHaveBeenCalledTimes(2);

    // Tentativo 2 avviene; sleep successivo = 1000ms (2^1 * 500)
    await jest.advanceTimersByTimeAsync(baseDelayMs * 2);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
