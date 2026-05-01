import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfiloDto, MainStackParamList } from '../../types';
import { userService } from '../../services/userService';

const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSoft: '#64748B',
  textMuted: '#94A3B8',
  primary: '#4A8FD4',
  primaryDark: '#2D6BB5',
} as const;

const AVATAR_GRADIENT: [string, string] = ['#6BA3E0', '#2B5BA8'];

function getRuoloTag(ruolo?: string) {
  if (!ruolo) return null;
  const r = ruolo.toUpperCase();
  if (r.includes('ADMIN'))      return { label: 'Admin',      bg: '#FEF3C7', text: '#92400E' };
  if (r.includes('PROFESSORE')) return { label: 'Professore', bg: '#DBEAFE', text: '#1E40AF' };
  if (r.includes('STUDENTE'))   return { label: 'Studente',   bg: '#D1FAE5', text: '#065F46' };
  return null;
}

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfiloDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const users = await userService.searchUsers(text);
      setResults(users);
    } catch {
      setError('Errore durante la ricerca. Riprova.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setError('');
  }

  return (
    <View style={styles.page}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca utenti per username, nome…"
          placeholderTextColor={C.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* States */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={C.primary} />
        </View>
      )}

      {error !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && query.length >= 2 && results.length === 0 && error === '' && (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🔎</Text>
          <Text style={styles.emptyTitle}>Nessun risultato</Text>
          <Text style={styles.emptySubtitle}>Prova con un altro termine di ricerca</Text>
        </View>
      )}

      {query.length < 2 && query.length > 0 && (
        <View style={styles.centered}>
          <Text style={styles.hintText}>Digita almeno 2 caratteri per cercare</Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const tag = getRuoloTag(item.ruolo);
          const initials = `${item.nome?.[0] ?? ''}${item.cognome?.[0] ?? ''}`.toUpperCase();
          return (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() => navigation.navigate('UserProfile', { username: item.username })}
              activeOpacity={0.75}
            >
              <LinearGradient colors={AVATAR_GRADIENT} style={styles.avatar}>
                <Text style={styles.avatarText}>{initials || '?'}</Text>
              </LinearGradient>
              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>{item.nome} {item.cognome}</Text>
                  {tag && (
                    <View style={[styles.roleTag, { backgroundColor: tag.bg }]}>
                      <Text style={[styles.roleTagText, { color: tag.text }]}>{tag.label}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userHandle}>@{item.username}</Text>
                <View style={styles.userStats}>
                  <Text style={styles.userStat}>{item.numPost} post</Text>
                  <Text style={styles.userStatDot}>·</Text>
                  <Text style={styles.userStat}>{item.numSeguaci} seguaci</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { fontSize: 16, color: C.textSoft },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    paddingVertical: 0,
  },
  clearIcon: { fontSize: 14, color: C.textMuted, fontWeight: '600' },

  centered: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 13, color: C.textSoft },
  hintText: { fontSize: 13, color: C.textMuted, textAlign: 'center' },

  errorBox: {
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 13, color: '#B91C1C' },

  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  userCard: {
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  userInfo: { flex: 1, gap: 2 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 15, fontWeight: '700', color: C.text },
  userHandle: { fontSize: 13, color: C.textSoft },
  userStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  userStat: { fontSize: 11, color: C.textMuted },
  userStatDot: { fontSize: 11, color: C.textMuted },
  roleTag: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  roleTagText: { fontSize: 10, fontWeight: '700' },
  chevron: { fontSize: 20, color: C.textMuted, fontWeight: '300' },
});
