import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { notificaService } from '../../services/notificaService';
import { NotificaDto, MainStackParamList } from '../../types';

const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSoft: '#64748B',
  textMuted: '#94A3B8',
  primary: '#4A8FD4',
  danger: '#E53E3E',
} as const;

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'adesso';
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  const d = Math.floor(h / 24);
  return `${d}g fa`;
}

function getIcona(tipo: string): string {
  switch (tipo) {
    case 'LIKE': return '★';
    case 'COMMENTO': return '💬';
    case 'FOLLOW': return '👤';
    case 'ISCRIZIONE_RICHIESTA': return '⏳';
    case 'ISCRIZIONE_APPROVATA': return '✅';
    case 'ISCRIZIONE_RIFIUTATA': return '❌';
    case 'ANNUNCIO': return '📢';
    case 'MESSAGGIO': return '✉️';
    default: return '🔔';
  }
}

function getColore(tipo: string): string {
  switch (tipo) {
    case 'LIKE': return '#F59E0B';
    case 'COMMENTO': return '#4A8FD4';
    case 'FOLLOW': return '#10B981';
    case 'ISCRIZIONE_RICHIESTA': return '#F97316';
    case 'ISCRIZIONE_APPROVATA': return '#10B981';
    case 'ISCRIZIONE_RIFIUTATA': return '#E53E3E';
    case 'ANNUNCIO': return '#8B5CF6';
    case 'MESSAGGIO': return '#4A8FD4';
    default: return '#94A3B8';
  }
}

function NotificaCard({
  notifica,
  onPress,
  onDelete,
}: {
  notifica: NotificaDto;
  onPress: (n: NotificaDto) => void;
  onDelete: (id: number) => void;
}) {
  const colore = getColore(notifica.tipo);
  return (
    <TouchableOpacity
      style={[styles.notificaCard, !notifica.letta && styles.notificaCardUnread]}
      onPress={() => onPress(notifica)}
      onLongPress={() => onDelete(notifica.id)}
      activeOpacity={0.75}
    >
      <View style={[styles.notificaIconWrap, { backgroundColor: colore + '20' }]}>
        <Text style={[styles.notificaIcon, { color: colore }]}>{getIcona(notifica.tipo)}</Text>
      </View>
      <View style={styles.notificaBody}>
        <Text style={styles.notificaMessaggio} numberOfLines={2}>{notifica.messaggio}</Text>
        <Text style={styles.notificaTime}>{timeAgo(notifica.createdAt)}</Text>
      </View>
      {!notifica.letta && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [notifiche, setNotifiche] = useState<NotificaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadNotifiche() {
    try {
      const data = await notificaService.getNotifiche(0, 50);
      setNotifiche(data);
      setError('');
    } catch {
      setError('Impossibile caricare le notifiche.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadNotifiche().finally(() => setLoading(false));
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadNotifiche();
    setRefreshing(false);
  }

  async function handlePress(n: NotificaDto) {
    if (!n.letta) {
      notificaService.segnaComeLetta(n.id).catch(() => {});
      setNotifiche(prev => prev.map(x => x.id === n.id ? { ...x, letta: true } : x));
    }
    if (n.tipoRiferimento === 'UTENTE') {
      navigation.navigate('UserProfile', { username: n.attoreUsername });
    } else if (n.tipoRiferimento === 'CONVERSAZIONE') {
      navigation.navigate('Chat', { username: n.attoreUsername });
    }
  }

  async function handleDelete(id: number) {
    try {
      await notificaService.elimina(id);
      setNotifiche(prev => prev.filter(x => x.id !== id));
    } catch {
      // silently ignore
    }
  }

  async function segnaLetteTutte() {
    try {
      await notificaService.segnaComeLetteTutte();
      setNotifiche(prev => prev.map(x => ({ ...x, letta: true })));
    } catch {
      // silently ignore
    }
  }

  const nonLette = notifiche.filter(n => !n.letta).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {/* Header bar */}
      {nonLette > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerBadge}>{nonLette} non lette</Text>
          <TouchableOpacity onPress={segnaLetteTutte}>
            <Text style={styles.headerAction}>Segna tutte come lette</Text>
          </TouchableOpacity>
        </View>
      )}

      {error !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={notifiche}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>Nessuna notifica</Text>
            <Text style={styles.emptySubtitle}>Le tue notifiche appariranno qui</Text>
          </View>
        }
        renderItem={({ item }) => (
          <NotificaCard
            notifica={item}
            onPress={handlePress}
            onDelete={handleDelete}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBadge: { fontSize: 13, fontWeight: '700', color: C.text },
  headerAction: { fontSize: 13, fontWeight: '600', color: C.primary },

  errorBox: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 13, color: '#B91C1C' },

  listContent: { padding: 16, paddingBottom: 32 },

  notificaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  notificaCardUnread: {
    borderColor: C.primary + '50',
    backgroundColor: '#F0F7FF',
  },
  notificaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificaIcon: { fontSize: 18 },
  notificaBody: { flex: 1, gap: 3 },
  notificaMessaggio: { fontSize: 13, color: C.text, lineHeight: 18 },
  notificaTime: { fontSize: 11, color: C.textMuted },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },

  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 13, color: C.textSoft },
});
