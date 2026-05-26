import React from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { MainStackParamList } from '../../types';
import { useAdminList } from '../../hooks/useAdminList';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { AdminCountBar } from '../../components/admin/AdminCountBar';

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  ADMIN:      { bg: '#FEF2F2', color: '#DC2626' },
  USER:       { bg: '#EFF6FF', color: '#2563EB' },
  PROFESSORE: { bg: '#F0FDF4', color: '#16A34A' },
  ISTITUTO:   { bg: '#FDF4FF', color: '#9333EA' },
};

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    marginHorizontal: 12, marginVertical: 6,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 16, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.text },
  aliasChip: {
    backgroundColor: C.inputBg, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
  },
  aliasText: { fontSize: 11, fontWeight: '600', color: C.textSoft },
  permRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  permChip: {
    backgroundColor: C.bg, borderRadius: 999, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: 8, paddingVertical: 3,
  },
  permText: { fontSize: 10, color: C.textSoft },
  countText: { fontSize: 12, color: C.textSoft, fontWeight: '600' },
});

export default function AdminRuoliScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { items: ruoli, loading, refreshing, refresh } = useAdminList(
    () => adminService.getRuoli(),
    'Impossibile caricare i ruoli.'
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;

  return (
    <FlatList
      style={styles.page}
      data={ruoli}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={{ paddingVertical: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.primary} />}
      ListHeaderComponent={<AdminCountBar label={`${ruoli.length} ruoli configurati`} />}
      ListEmptyComponent={<AdminEmptyState icon="shield-off-outline" text="Nessun ruolo" />}
      renderItem={({ item }) => {
        const roleKey = item.nome?.toUpperCase() ?? '';
        const col = ROLE_COLORS[roleKey] ?? { bg: C.inputBg, color: C.textSoft };
        const permCount = item.ruoloPermessi?.length ?? 0;
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AdminRuoloDetail', { ruoloId: item.id, ruoloNome: item.nome })}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: col.bg }]}>
                <MaterialCommunityIcons name="shield-account" size={22} color={col.color} />
              </View>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <View style={styles.aliasChip}>
                <Text style={styles.aliasText}>{item.alias}</Text>
              </View>
            </View>
            <Text style={styles.countText}>{permCount} permessi assegnati</Text>
            {permCount > 0 && (
              <View style={styles.permRow}>
                {(item.ruoloPermessi ?? []).slice(0, 8).map(rp => (
                  <View key={rp.id} style={styles.permChip}>
                    <Text style={styles.permText}>{rp.permesso?.alias ?? rp.alias ?? '—'}</Text>
                  </View>
                ))}
                {permCount > 8 && (
                  <View style={styles.permChip}>
                    <Text style={styles.permText}>+{permCount - 8}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}
