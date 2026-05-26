import { Alert } from 'react-native';

export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => Promise<void>,
  errorMsg = 'Impossibile eliminare.'
): void {
  Alert.alert(title, message, [
    { text: 'Annulla', style: 'cancel' },
    {
      text: 'Elimina',
      style: 'destructive',
      onPress: () => { onConfirm().catch(() => Alert.alert('Errore', errorMsg)); },
    },
  ]);
}
