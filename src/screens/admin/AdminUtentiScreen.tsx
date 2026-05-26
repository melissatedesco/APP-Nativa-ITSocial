import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, ThemeColors, getRuoloBadge } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { MainStackParamList } from '../../types';
import { useAdminList } from '../../hooks/useAdminList';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { AdminCountBar } from '../../components/admin/AdminCountBar';
import { confirmDelete } from '../../utils/confirmDelete';

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: C.text },
  email: { fontSize: 12, color: C.textSoft },
  badge: {
    alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8,
    paddingVertical: 2, borderWidth: 1, marginTop: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  deleteBtn: { padding: 6 },
});

export default function AdminUtentiScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { items: utenti, setItems: setUtenti, loading, refreshing, refresh } = useAdminList(
    () => adminService.getUtenti(),
    'Impossibile caricare gli utenti.'
  );

  function handleDelete(id: number, username: string) {
    confirmDelete(
      'Elimina utente',
      `Vuoi eliminare @${username}?`,
      async () => {
        await adminService.eliminaUtente(id);
        setUtenti(prev => prev.filter(u => u.id !== id));
      },
      "Impossibile eliminare l'utente."
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;

  return (
    <FlatList
      style={styles.page}
      data={utenti}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.primary} />}
      ListHeaderComponent={<AdminCountBar label={`${utenti.length} utenti registrati`} />}
      ListEmptyComponent={<AdminEmptyState icon="account-off-outline" text="Nessun utente" />}
      renderItem={({ item }) => {
        const ruoloTag = getRuoloBadge(item.ruolo?.nome);
        const letter = (item.username?.[0] ?? '?').toUpperCase();
        return (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('UserProfile', { username: item.username })}
            activeOpacity={0.75}
          >
            <View style={[styles.avatar, { backgroundColor: C.primary }]}>
              <Text style={styles.avatarText}>{letter}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.nome} {item.cognome}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <View style={[styles.badge, { backgroundColor: ruoloTag.bg, borderColor: ruoloTag.border }]}>
                <Text style={[styles.badgeText, { color: ruoloTag.text }]}>{ruoloTag.label}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.username)}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={C.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      }}
    />
  );
}
