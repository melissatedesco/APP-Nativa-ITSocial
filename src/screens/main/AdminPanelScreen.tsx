import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { MainStackParamList } from '../../types';

interface StatItem { label: string; value: number; icon: string; color: string }

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 16 },

  header: { gap: 4, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.4 },
  headerSub: { fontSize: 13, color: C.textSoft },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '600', color: C.textSoft, textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textSoft, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
  },
  actionIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  actionDesc: { fontSize: 12, color: C.textSoft, marginTop: 2 },
  actionChevron: { opacity: 0.4 },

  divider: { height: 1, backgroundColor: C.border },
});

type Action = {
  title: string;
  desc: string;
  icon: string;
  bg: string;
  color: string;
  onPress: () => void;
};

export default function AdminPanelScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [totalUtenti, setTotalUtenti] = useState<number | null>(null);
  const [totalRuoli, setTotalRuoli] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/utenti/tutti').catch(() => null),
      api.get('/ruoli/tutti').catch(() => null),
    ]).then(([u, r]) => {
      setTotalUtenti(Array.isArray(u?.data) ? u.data.length : null);
      setTotalRuoli(Array.isArray(r?.data) ? r.data.length : null);
    }).finally(() => setLoading(false));
  }, []);

  const actions: Action[] = [
    {
      title: 'Gestisci Utenti',
      desc: 'Visualizza, modifica o elimina gli account',
      icon: 'account-group',
      bg: '#EFF6FF',
      color: '#2563EB',
      onPress: () => navigation.navigate('AdminUtenti'),
    },
    {
      title: 'Gestisci Ruoli',
      desc: 'Crea e modifica i ruoli della piattaforma',
      icon: 'shield-account',
      bg: '#F0FDF4',
      color: '#16A34A',
      onPress: () => navigation.navigate('AdminRuoli'),
    },
    {
      title: 'Gestisci Permessi',
      desc: 'Associa permessi ai ruoli',
      icon: 'key-variant',
      bg: '#FFF7ED',
      color: '#EA580C',
      onPress: () => navigation.navigate('AdminPermessi'),
    },
    {
      title: 'Gestisci Classi Corso',
      desc: 'Visualizza le classi e i docenti assegnati',
      icon: 'book-open-variant',
      bg: '#EFF6FF',
      color: '#2563EB',
      onPress: () => navigation.navigate('AdminClasseCorso'),
    },
    {
      title: 'Gestisci Istituti',
      desc: 'Visualizza e gestisci gli istituti scolastici',
      icon: 'domain',
      bg: '#F0FDF4',
      color: '#16A34A',
      onPress: () => navigation.navigate('AdminIstituti'),
    },
    {
      title: 'Gestisci Docenti',
      desc: 'Aggiungi, modifica o rimuovi i docenti',
      icon: 'account-tie',
      bg: '#FFF7ED',
      color: '#EA580C',
      onPress: () => navigation.navigate('AdminDocenti'),
    },
  ];

  return (
    <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pannello Admin</Text>
          <Text style={styles.headerSub}>Gestione e configurazione della piattaforma</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="account-multiple" size={22} color={C.primary} />
            {loading ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Text style={styles.statValue}>{totalUtenti ?? '—'}</Text>
            )}
            <Text style={styles.statLabel}>Utenti</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="shield-half-full" size={22} color="#16A34A" />
            {loading ? (
              <ActivityIndicator size="small" color="#16A34A" />
            ) : (
              <Text style={styles.statValue}>{totalRuoli ?? '—'}</Text>
            )}
            <Text style={styles.statLabel}>Ruoli</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Azioni */}
        <Text style={styles.sectionTitle}>Azioni rapide</Text>
        {actions.map((a, i) => (
          <TouchableOpacity key={i} style={styles.actionCard} onPress={a.onPress} activeOpacity={0.75}>
            <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
              <MaterialCommunityIcons name={a.icon as any} size={22} color={a.color} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionDesc}>{a.desc}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.text} style={styles.actionChevron} />
          </TouchableOpacity>
        ))}

      </View>
    </ScrollView>
  );
}
