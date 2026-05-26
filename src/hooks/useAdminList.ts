import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

export function useAdminList<T>(
  fetchFn: () => Promise<T[]>,
  errorMsg = 'Impossibile caricare i dati.'
) {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    try {
      setItems(await fetchRef.current());
    } catch {
      Alert.alert('Errore', errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [errorMsg]);

  useEffect(() => { reload(); }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    reload();
  }, [reload]);

  return { items, setItems, loading, refreshing, refresh, reload };
}
