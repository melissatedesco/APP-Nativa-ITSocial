import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useTheme, ThemeColors, getRuoloBadge } from '../../context/ThemeContext';
import { MEDIA_BASE_URL } from '../../services/api';
import { userService } from '../../services/userService';
import { ProfiloDto, MainStackParamList } from '../../types';

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page:    { flex: 1, backgroundColor: C.bg },
  content: { paddingVertical: 8 },

  // error / empty
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  centerTitle:{ fontSize: 15, fontWeight: '700', color: C.text, textAlign: 'center' },
  centerSub:  { fontSize: 13, color: C.textSoft, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: C.primary, borderRadius: 999, marginTop: 4,
  },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // user row
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  avatarGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 18 },
  avatarImg: { width: '100%', height: '100%' },

  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '700', color: C.text },
  username: { fontSize: 13, color: C.textSoft },
  bio: { fontSize: 12, color: C.textSoft, marginTop: 2 },
  roleBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  roleBadgeText: { fontSize: 10, fontWeight: '700' },

  // follow button
  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1.5,
    borderColor: C.primary,
  },
  followBtnActive: {
    backgroundColor: C.primary, borderColor: C.primary,
  },
  followBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },
  followBtnTextActive: { color: '#fff' },
});

// ─── UserRow ──────────────────────────────────────────────────────────────────

function UserRow({
  user, isCurrentUser, onPress, onFollowToggle,
}: {
  user: ProfiloDto;
  isCurrentUser: boolean;
  onPress: () => void;
  onFollowToggle: (username: string, nowFollowing: boolean) => void;
}) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const [following, setFollowing] = useState(user.seguito ?? false);
  const [loading, setLoading] = useState(false);
  const letter = (user.nome?.[0] ?? user.username?.[0] ?? '?').toUpperCase();
  const ruoloTag = getRuoloBadge(user.ruolo);

  async function handleToggle() {
    if (loading) return;
    const next = !following;
    setFollowing(next);
    setLoading(true);
    try {
      if (next) await userService.followUser(user.username);
      else      await userService.unfollowUser(user.username);
      onFollowToggle(user.username, next);
    } catch {
      setFollowing(!next); // rollback
    } finally {
      setLoading(false);
    }
  }

  const photoUri = user.fotoProfilo
    ? (user.fotoProfilo.startsWith('http') ? user.fotoProfilo : MEDIA_BASE_URL + user.fotoProfilo)
    : null;

  return (
    <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.75}>
      {/* Avatar */}
      <View style={S.avatar}>
        {photoUri ? (
          <ExpoImage source={{ uri: photoUri }} style={S.avatarImg} contentFit="cover" />
        ) : (
          <LinearGradient colors={[C.primary, C.primaryDark]} style={S.avatarGrad}>
            <Text style={S.avatarLetter}>{letter}</Text>
          </LinearGradient>
        )}
      </View>

      {/* Info */}
      <View style={S.info}>
        <View style={S.nameRow}>
          <Text style={S.name} numberOfLines={1}>{user.nome} {user.cognome}</Text>
          {ruoloTag && (
            <View style={[S.roleBadge, { backgroundColor: ruoloTag.bg, borderColor: ruoloTag.border }]}>
              <Text style={[S.roleBadgeText, { color: ruoloTag.text }]}>{ruoloTag.label}</Text>
            </View>
          )}
        </View>
        <Text style={S.username} numberOfLines={1}>@{user.username}</Text>
        {user.bio ? <Text style={S.bio} numberOfLines={1}>{user.bio}</Text> : null}
      </View>

      {/* Follow button — hidden for current user */}
      {!isCurrentUser && (
        <TouchableOpacity
          style={[S.followBtn, following && S.followBtnActive]}
          onPress={handleToggle}
          disabled={loading}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={following ? '#fff' : C.primary} />
          ) : (
            <>
              <MaterialCommunityIcons
                name={following ? 'account-check' : 'account-plus-outline'}
                size={14}
                color={following ? '#fff' : C.primary}
              />
              <Text style={[S.followBtnText, following && S.followBtnTextActive]}>
                {following ? 'Seguito' : 'Segui'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── UserListScreen ───────────────────────────────────────────────────────────

export default function UserListScreen() {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { username, type } = route.params as { title: string; username: string; type: 'seguaci' | 'seguiti' };
  const { user: me } = useAuth();
  const currentUsername = me?.username ?? '';

  const [users, setUsers] = useState<ProfiloDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Track follow counts so we can update the header subtitle
  const followingCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const fn = type === 'seguaci' ? userService.getSeguaci : userService.getSeguiti;
      const data = await fn(username);
      setUsers(data);
      setError('');
    } catch {
      setError('Impossibile caricare la lista.');
    }
  }, [username, type]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function handleFollowToggle(_: string, nowFollowing: boolean) {
    followingCount.current += nowFollowing ? 1 : -1;
  }

  if (loading) {
    return <View style={S.center}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  if (error) {
    return (
      <View style={S.center}>
        <MaterialCommunityIcons name="cloud-off-outline" size={52} color={C.textMuted} />
        <Text style={S.centerTitle}>Qualcosa è andato storto</Text>
        <Text style={S.centerSub}>{error}</Text>
        <TouchableOpacity style={S.retryBtn} onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }}>
          <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
          <Text style={S.retryBtnText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (users.length === 0) {
    const emptyMsg = type === 'seguaci'
      ? 'Questo utente non ha ancora seguaci.'
      : 'Questo utente non segue ancora nessuno.';
    return (
      <View style={S.center}>
        <MaterialCommunityIcons name="account-group-outline" size={52} color={C.textMuted} />
        <Text style={S.centerTitle}>Nessun utente</Text>
        <Text style={S.centerSub}>{emptyMsg}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={S.page}
      contentContainerStyle={S.content}
      data={users}
      keyExtractor={item => String(item.id ?? item.username)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
      renderItem={({ item }) => (
        <UserRow
          user={item}
          isCurrentUser={item.username === currentUsername}
          onPress={() => navigation.navigate('UserProfile', { username: item.username })}
          onFollowToggle={handleFollowToggle}
        />
      )}
    />
  );
}
