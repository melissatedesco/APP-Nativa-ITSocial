import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useAdminList } from '../../hooks/useAdminList';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('useAdminList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('avvia con loading=true e items vuoti', async () => {
    const fetchFn = jest.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useAdminList(fetchFn));

    // Stato sincrono prima che la Promise si risolva
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);

    // Aspetta che l'async si stabilizzi per evitare act() warnings
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('imposta loading=false e items dopo il caricamento', async () => {
    const data = [{ id: 1, nome: 'Istituto A' }, { id: 2, nome: 'Istituto B' }];
    const fetchFn = jest.fn().mockResolvedValue(data);

    const { result } = renderHook(() => useAdminList(fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual(data);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('mostra Alert con messaggio personalizzato in caso di errore', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('Server offline'));

    const { result } = renderHook(() =>
      useAdminList(fetchFn, 'Impossibile caricare gli istituti.')
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Impossibile caricare gli istituti.');
    expect(result.current.items).toEqual([]);
  });

  it('usa il messaggio di errore di default se non specificato', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useAdminList(fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Impossibile caricare i dati.');
  });

  it('imposta refreshing=true durante il refresh e false al termine', async () => {
    const fetchFn = jest.fn().mockResolvedValue([{ id: 1 }]);

    const { result } = renderHook(() => useAdminList(fetchFn));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.refresh(); });

    expect(result.current.refreshing).toBe(true);

    await waitFor(() => expect(result.current.refreshing).toBe(false));

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('aggiorna i dati alla seconda chiamata reload', async () => {
    const primiDati = [{ id: 1 }];
    const nuoviDati = [{ id: 1 }, { id: 2 }];
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(primiDati)
      .mockResolvedValueOnce(nuoviDati);

    const { result } = renderHook(() => useAdminList(fetchFn));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual(primiDati);

    await act(async () => { await result.current.reload(); });

    expect(result.current.items).toEqual(nuoviDati);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('setItems permette aggiornamenti manuali dello stato', async () => {
    const fetchFn = jest.fn().mockResolvedValue([{ id: 1 }]);

    const { result } = renderHook(() => useAdminList(fetchFn));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const nuovoItem = { id: 99, nome: 'Nuovo' };
    act(() => {
      result.current.setItems(prev => [...prev, nuovoItem]);
    });

    expect(result.current.items).toContainEqual(nuovoItem);
  });
});
