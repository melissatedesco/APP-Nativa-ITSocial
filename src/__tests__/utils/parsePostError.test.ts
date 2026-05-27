import axios, { AxiosError } from 'axios';
import { parsePostError } from '../../hooks/useFeed';

function axiosError(status: number, data: object = {}): AxiosError {
  const err = new axios.AxiosError('test');
  Object.defineProperty(err, 'response', {
    value: { status, data },
    writable: true,
  });
  return err;
}

function networkError(): AxiosError {
  const err = new axios.AxiosError('Network Error');
  Object.defineProperty(err, 'response', { value: undefined, writable: true });
  return err;
}

describe('parsePostError', () => {
  it('restituisce messaggio di connessione quando non c\'è risposta dal server', () => {
    expect(parsePostError(networkError())).toBe(
      'Impossibile raggiungere il server. Controlla la connessione.'
    );
  });

  it('restituisce messaggio permessi per status 403', () => {
    expect(parsePostError(axiosError(403))).toBe(
      'Non hai i permessi per questa operazione.'
    );
  });

  it('restituisce messaggio dimensione file per status 413', () => {
    expect(parsePostError(axiosError(413))).toBe(
      'Il file è troppo grande (massimo 10 MB).'
    );
  });

  it('usa il messaggio specifico del server quando disponibile', () => {
    const err = axiosError(400, { message: 'Il testo del post è troppo lungo.' });
    expect(parsePostError(err)).toBe('Il testo del post è troppo lungo.');
  });

  it('restituisce messaggio generico per errori 5xx senza messaggio server', () => {
    expect(parsePostError(axiosError(500))).toBe(
      'Errore del server. Riprova più tardi.'
    );
    expect(parsePostError(axiosError(503))).toBe(
      'Errore del server. Riprova più tardi.'
    );
  });

  it('il messaggio del server ha precedenza su status 5xx', () => {
    const err = axiosError(502, { message: 'Gateway timeout.' });
    expect(parsePostError(err)).toBe('Gateway timeout.');
  });

  it('restituisce messaggio generico per errori non-Axios', () => {
    expect(parsePostError(new Error('Qualsiasi errore'))).toBe(
      'Si è verificato un errore imprevisto.'
    );
  });

  it('restituisce messaggio generico per valori primitivi', () => {
    expect(parsePostError('stringa')).toBe('Si è verificato un errore imprevisto.');
    expect(parsePostError(null)).toBe('Si è verificato un errore imprevisto.');
    expect(parsePostError(undefined)).toBe('Si è verificato un errore imprevisto.');
  });
});
