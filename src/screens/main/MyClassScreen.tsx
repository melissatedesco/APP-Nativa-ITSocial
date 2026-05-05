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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { classeService } from '../../services/classeService';
import { IscrizioneClasseDto } from '../../types';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

function getStatoBadge(stato: string) {
  if (stato === 'APPROVATA') return { label: 'Approvata', bg: 'rgba(74,222,128,0.15)',  text: '#16a34a' };
  if (stato === 'IN_ATTESA') return { label: 'In attesa', bg: 'rgba(245,158,11,0.15)', text: '#d97706' };
  if (stato === 'RIFIUTATA') return { label: 'Rifiutata', bg: 'rgba(239,68,68,0.15)',  text: '#ef4444' };
  return { label: stato, bg: 'rgba(148,163,184,0.15)', text: '#64748b' };
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  listContent: { padding: 16, paddingBottom: 40 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center' },
  errorText: { fontSize: 13, color: C.textSoft, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: C.primary,
    borderRadius: 999,
  },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 13, color: C.textSoft, textAlign: 'center', paddingHorizontal: 32 },

  classeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
    shadowColor: '#1A2433',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  classeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classeInfo: { flex: 1, gap: 3 },
  classeName: { fontSize: 15, fontWeight: '700', color: C.text },
  classeProfessore: { fontSize: 12, color: C.textSoft },

  classBanner: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 6,
  },
  bannerContent: { alignItems: 'center', gap: 8 },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
    shadowColor: '#1A2433',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  studentInfo: { flex: 1, gap: 2 },
  studentName: { fontSize: 14, fontWeight: '700', color: C.text },
  studentUsername: { fontSize: 12, color: C.textSoft },

  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
});

function AvatarCircle({ name, size = 44 }: { name?: string; size?: number }) {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const AVATAR_GRADIENT: [string, string] = [C.primary, C.primaryDark];
  const letters = (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map(p => p[0] ?? '')
    .join('')
    .toUpperCase();
  return (
    <LinearGradient
      colors={AVATAR_GRADIENT}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{letters || '?'}</Text>
    </LinearGradient>
  );
}

function StudenteCard({ item }: { item: IscrizioneClasseDto }) {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const badge = getStatoBadge(item.stato);
  return (
    <View style={styles.studentCard}>
      <AvatarCircle name={item.studenteNome} size={44} />
      <View style={styles.studentInfo}>
        <Text style={styles.studentName} numberOfLines={1}>
          {item.studenteNome ?? 'Utente'}
        </Text>
        <Text style={styles.studentUsername}>@{item.studenteUsername}</Text>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.roleBadgeText, { color: badge.text }]}>{badge.label}</Text>
      </View>
    </View>
  );
}

type ViewMode = 'list' | 'detail';

export default function MyClassScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const CLASS_GRADIENT: [string, string, string] = [C.primary, C.primaryDark, '#006064'];

  const [iscrizioni, setIscrizioni] = useState<IscrizioneClasseDto[]>([]);
  const [studenti, setStudenti] = useState<IscrizioneClasseDto[]>([]);
  const [selectedClasse, setSelectedClasse] = useState<IscrizioneClasseDto | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [loadingStudenti, setLoadingStudenti] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadIscrizioni() {
    try {
      const data = await classeService.miIscrizioni();
      const approvate = data.filter(i => i.stato === 'APPROVATA');
      setIscrizioni(Array.isArray(approvate) ? approvate : []);
      setError('');
    } catch {
      setError('Impossibile caricare le classi.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setView('list');
      setSelectedClasse(null);
      loadIscrizioni();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadIscrizioni();
    setRefreshing(false);
  }

  async function handleOpenClasse(iscrizione: IscrizioneClasseDto) {
    setSelectedClasse(iscrizione);
    setView('detail');
    setLoadingStudenti(true);
    try {
      const data = await classeService.studentiClasse(iscrizione.classeId);
      setStudenti(Array.isArray(data) ? data : []);
    } catch {
      setStudenti([]);
    } finally {
      setLoadingStudenti(false);
    }
  }

  function handleBack() {
    setView('list');
    setSelectedClasse(null);
    setStudenti([]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="cloud-off-outline" size={52} color={C.textMuted} />
        <Text style={styles.errorTitle}>Qualcosa è andato storto</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadIscrizioni(); }}>
          <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryBtnText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (view === 'detail' && selectedClasse) {
    return (
      <View style={styles.page}>
        <LinearGradient colors={CLASS_GRADIENT} style={styles.classBanner}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.bannerContent}>
            <MaterialCommunityIcons name="account-group" size={32} color="rgba(255,255,255,0.85)" />
            <Text style={styles.bannerTitle}>{selectedClasse.classeNome}</Text>
            {selectedClasse.professoreNome ? (
              <Text style={styles.bannerSub}>
                Docente: {selectedClasse.professoreNome}
              </Text>
            ) : null}
          </View>
        </LinearGradient>

        <Text style={styles.sectionLabel}>Studenti iscritti</Text>

        {loadingStudenti ? (
          <View style={styles.centered}>
            <ActivityIndicator color={C.primary} />
          </View>
        ) : studenti.length === 0 ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyTitle}>Nessuno studente</Text>
            <Text style={styles.emptySubtitle}>Non ci sono studenti approvati in questa classe</Text>
          </View>
        ) : (
          <FlatList
            data={studenti}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <StudenteCard item={item} />}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={iscrizioni}
      keyExtractor={item => String(item.id)}
      style={styles.page}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="school-outline" size={56} color={C.textMuted} />
          <Text style={styles.emptyTitle}>Nessuna classe</Text>
          <Text style={styles.emptySubtitle}>
            Non sei ancora iscritto a nessuna classe
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.classeCard}
          onPress={() => handleOpenClasse(item)}
          activeOpacity={0.75}
        >
          <LinearGradient colors={CLASS_GRADIENT} style={styles.classeIcon}>
            <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.classeInfo}>
            <Text style={styles.classeName} numberOfLines={1}>{item.classeNome}</Text>
            {item.professoreNome ? (
              <Text style={styles.classeProfessore} numberOfLines={1}>
                Docente: {item.professoreNome}
              </Text>
            ) : null}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={C.textMuted} />
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    />
  );
}
