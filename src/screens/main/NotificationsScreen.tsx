import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { notificaService } from '../../services/notificaService';
import { NotificaDto, MainStackParamList } from '../../types';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

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

function getIconConfig(tipo: string): { name: MCIName; color: string } {
  switch (tipo) {
    case 'LIKE':                 return { name: 'star-outline',            color: '#F59E0B' };
    case 'COMMENTO':             return { name: 'comment-outline',          color: '#00bcd4' };
    case 'FOLLOW':               return { name: 'account-plus-outline',     color: '#10B981' };
    case 'ISCRIZIONE_RICHIESTA': return { name: 'clock-outline',            color: '#F97316' };
    case 'ISCRIZIONE_APPROVATA': return { name: 'check-circle-outline',     color: '#10B981' };
    case 'ISCRIZIONE_RIFIUTATA': return { name: 'close-circle-outline',     color: '#ef4444' };
    case 'ANNUNCIO':             return { name: 'bullhorn-outline',         color: '#8B5CF6' };
    case 'MESSAGGIO':            return { name: 'email-outline',            color: '#00bcd4' };
    default:                     return { name: 'bell-outline',             color: '#9ca3af' };
  }
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },

  errorTitle: { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center' },
  errorMessage: { fontSize: 13, color: C.textSoft, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBadge: { fontSize: 13, fontWeight: '700', color: C.text },
  headerAction: { fontSize: 13, fontWeight: '600', color: C.primary },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    margin: 12,
    padding: 12,
    backgroundColor: C.dangerBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.danger + '40',
  },
  errorBannerText: { fontSize: 13, color: C.danger, flex: 1 },

  listContent: { padding: 12, paddingBottom: 32 },

  notificaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  notificaCardUnread: {
    borderColor: C.primary + '50',
    backgroundColor: C.saveBg,
  },
  notificaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificaBody: { flex: 1, gap: 3 },
  notificaMessaggio: { fontSize: 13, color: C.text, lineHeight: 18 },
  notificaTime: { fontSize: 11, color: C.textMuted },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },

  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 13, color: C.textSoft },
});

function NotificaCard({
  notifica,
  onPress,
  onDelete,
}: {
  notifica: NotificaDto;
  onPress: (n: NotificaDto) => void;
  onDelete: (id: number) => void;
}) {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const { name, color } = getIconConfig(notifica.tipo);
  return (
    <TouchableOpacity
      style={[styles.notificaCard, !notifica.letta && styles.notificaCardUnread]}
      onPress={() => onPress(notifica)}
      onLongPress={() => onDelete(notifica.id)}
      activeOpacity={0.75}
    >
      <View style={[styles.notificaIconWrap, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={name} size={20} color={color} />
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
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
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

  async function handleRetry() {
    setError('');
    setLoading(true);
    await loadNotifiche();
    setLoading(false);
  }

  async function handlePress(n: NotificaDto) {
    if (!n.letta) {
      notificaService.segnaComeLetta(n.id).catch(() => {});
      setNotifiche(prev => prev.map(x => x.id === n.id ? { ...x, letta: true } : x));
    }
    if (n.tipo === 'MESSAGGIO' || n.tipoRiferimento === 'CONVERSAZIONE') {
      navigation.navigate('Chat', { username: n.attoreUsername });
    } else if (n.attoreUsername) {
      // LIKE, COMMENTO, FOLLOW, ISCRIZIONE_* → profilo di chi ha agito
      navigation.navigate('UserProfile', { username: n.attoreUsername });
    }
  }

  async function handleDelete(id: number) {
    try {
      await notificaService.elimina(id);
      setNotifiche(prev => prev.filter(x => x.id !== id));
    } catch {
      // ignore
    }
  }

  async function segnaLetteTutte() {
    try {
      await notificaService.segnaComeLetteTutte();
      setNotifiche(prev => prev.map(x => ({ ...x, letta: true })));
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error && notifiche.length === 0) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="cloud-off-outline" size={52} color={C.textMuted} />
        <Text style={styles.errorTitle}>Qualcosa è andato storto</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
          <MaterialCommunityIcons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.retryBtnText}>Ricarica</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nonLette = notifiche.filter(n => !n.letta).length;

  return (
    <View style={styles.page}>
      {nonLette > 0 && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="circle-small" size={16} color={C.primary} />
            <Text style={styles.headerBadge}>{nonLette} non lette</Text>
          </View>
          <TouchableOpacity onPress={segnaLetteTutte}>
            <Text style={styles.headerAction}>Segna tutte come lette</Text>
          </TouchableOpacity>
        </View>
      )}

      {error !== '' && notifiche.length > 0 && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-outline" size={14} color={C.danger} />
          <Text style={styles.errorBannerText}>{error}</Text>
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
            <MaterialCommunityIcons name="bell-off-outline" size={52} color={C.textMuted} />
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
