import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, SectionList, StyleSheet, ActivityIndicator,
  Alert, RefreshControl, Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { MainStackParamList, PermessoAdminDto } from '../../types';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';

type RouteT = RouteProp<MainStackParamList, 'AdminRuoloDetail'>;

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoBar: {
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
    paddingHorizontal: 16, paddingVertical: 12, gap: 2,
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  infoSub: { fontSize: 12, color: C.textSoft },
  sectionHeader: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: C.bg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  rowText: { flex: 1 },
  nome: { fontSize: 14, fontWeight: '600', color: C.text },
  alias: { fontSize: 11, color: C.textSoft, marginTop: 1 },
});

export default function AdminRuoloDetailScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const { params } = useRoute<RouteT>();
  const { ruoloId, ruoloNome } = params;

  const [sections, setSections] = useState<{ title: string; data: PermessoAdminDto[] }[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedCount, setAssignedCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [tutti, assegnati] = await Promise.all([
        adminService.getPermessi(),
        adminService.getPermessiPerRuolo(ruoloId),
      ]);
      const ids = new Set<number>(assegnati.map(p => p.id));
      setAssignedIds(ids);
      setAssignedCount(ids.size);
      const grouped: Record<string, PermessoAdminDto[]> = {};
      for (const p of tutti) {
        const gruppo = p.gruppo?.nome ?? 'Altro';
        if (!grouped[gruppo]) grouped[gruppo] = [];
        grouped[gruppo].push(p);
      }
      setSections(Object.entries(grouped).map(([title, data]) => ({ title, data })));
    } catch {
      Alert.alert('Errore', 'Impossibile caricare i permessi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ruoloId]);

  useEffect(() => { load(); }, []);

  async function handleToggle(permessoId: number, currentlyAssigned: boolean) {
    setToggling(prev => new Set(prev).add(permessoId));
    try {
      if (currentlyAssigned) {
        await adminService.rimuoviPermesso(ruoloId, permessoId);
        setAssignedIds(prev => { const s = new Set(prev); s.delete(permessoId); return s; });
        setAssignedCount(c => c - 1);
      } else {
        await adminService.assegnaPermesso(ruoloId, permessoId);
        setAssignedIds(prev => new Set(prev).add(permessoId));
        setAssignedCount(c => c + 1);
      }
    } catch {
      Alert.alert('Errore', 'Impossibile aggiornare il permesso.');
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(permessoId); return s; });
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;

  return (
    <SectionList
      style={styles.page}
      sections={sections}
      keyExtractor={item => String(item.id)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={C.primary}
        />
      }
      ListHeaderComponent={
        <View style={styles.infoBar}>
          <Text style={styles.infoTitle}>Ruolo: {ruoloNome}</Text>
          <Text style={styles.infoSub}>{assignedCount} permessi attivi — attiva o disattiva con il toggle</Text>
        </View>
      }
      ListEmptyComponent={<AdminEmptyState icon="key-outline" text="Nessun permesso disponibile" />}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title} ({section.data.length})</Text>
        </View>
      )}
      renderItem={({ item }) => {
        const assigned = assignedIds.has(item.id);
        const isToggling = toggling.has(item.id);
        return (
          <View style={styles.row}>
            <MaterialCommunityIcons
              name={assigned ? 'key' : 'key-outline'}
              size={18}
              color={assigned ? C.primary : C.textMuted}
            />
            <View style={styles.rowText}>
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.alias}>{item.alias}</Text>
            </View>
            {isToggling
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Switch
                  value={assigned}
                  onValueChange={() => handleToggle(item.id, assigned)}
                  trackColor={{ false: C.border, true: C.primary + '88' }}
                  thumbColor={assigned ? C.primary : C.textSoft}
                />
            }
          </View>
        );
      }}
    />
  );
}
