import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Alert, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';

const TIPO_COLORS: Record<string, { bg: string; color: string }> = {
  PUBBLICA:  { bg: '#EFF6FF', color: '#2563EB' },
  PRIVATA:   { bg: '#FDF4FF', color: '#9333EA' },
};

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { color: C.textSoft, fontSize: 14 },
  countBar: {
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  countText: { fontSize: 13, color: C.textSoft, fontWeight: '600' },
  card: {
    marginHorizontal: 12, marginVertical: 6,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 16, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  tipoChip: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
  },
  tipoText: { fontSize: 11, fontWeight: '700' },
  descText: { fontSize: 13, color: C.textSoft, lineHeight: 18 },
  divider: { height: 1, backgroundColor: C.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: C.textSoft },
  docenteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.inputBg, borderRadius: 10, padding: 10,
  },
  docenteAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
  },
  docenteAvatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  docenteInfo: { flex: 1 },
  docenteName: { fontSize: 13, fontWeight: '700', color: C.text },
  docenteUsername: { fontSize: 11, color: C.textSoft },
  noDocenteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.inputBg, borderRadius: 10, padding: 10,
  },
  noDocenteText: { fontSize: 13, color: C.textMuted, fontStyle: 'italic' },
});

export default function AdminIstitutiScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const [classi, setClassi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setClassi(await adminService.getClassi());
    } catch {
      Alert.alert('Errore', 'Impossibile caricare gli istituti.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;

  return (
    <FlatList
      style={styles.page}
      data={classi}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={{ paddingVertical: 8 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={C.primary}
        />
      }
      ListHeaderComponent={
        <View style={styles.countBar}>
          <Text style={styles.countText}>{classi.length} istituti registrati</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <MaterialCommunityIcons name="school-outline" size={48} color={C.textMuted} />
          <Text style={styles.emptyText}>Nessun istituto</Text>
        </View>
      }
      renderItem={({ item }) => {
        const tipoCol = TIPO_COLORS[item.tipo] ?? { bg: C.inputBg, color: C.textSoft };
        const hasDocente = !!item.professoreNome;
        const firstLetter = (item.professoreNome ?? '?')[0].toUpperCase();

        return (
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="school" size={22} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <View style={[styles.tipoChip, { backgroundColor: tipoCol.bg }]}>
                <Text style={[styles.tipoText, { color: tipoCol.color }]}>{item.tipo}</Text>
              </View>
            </View>

            {/* Descrizione */}
            {!!item.descrizione && (
              <Text style={styles.descText} numberOfLines={2}>{item.descrizione}</Text>
            )}

            <View style={styles.divider} />

            {/* Statistiche */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account-group-outline" size={15} color={C.textSoft} />
                <Text style={styles.infoText}>{item.numeroStudenti ?? 0} studenti</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="key-outline" size={15} color={C.textSoft} />
                <Text style={styles.infoText}>{item.codiceInvito}</Text>
              </View>
            </View>

            {/* Docente */}
            {hasDocente ? (
              <View style={styles.docenteRow}>
                <View style={styles.docenteAvatar}>
                  <Text style={styles.docenteAvatarText}>{firstLetter}</Text>
                </View>
                <View style={styles.docenteInfo}>
                  <Text style={styles.docenteName}>{item.professoreNome}</Text>
                  <Text style={styles.docenteUsername}>@{item.professoreUsername}</Text>
                </View>
                <MaterialCommunityIcons name="account-tie" size={18} color={C.textSoft} />
              </View>
            ) : (
              <View style={styles.noDocenteRow}>
                <MaterialCommunityIcons name="account-off-outline" size={16} color={C.textMuted} />
                <Text style={styles.noDocenteText}>Nessun docente assegnato</Text>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}
