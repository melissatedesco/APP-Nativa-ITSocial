import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/UserContext';
import { userService } from '../../services/userService';
import { ProfiloDto, Post, MainStackParamList } from '../../types';

const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSoft: '#64748B',
  textMuted: '#94A3B8',
  primary: '#4A8FD4',
  primaryDark: '#2D6BB5',
  brand700: '#2B5BA8',
  danger: '#E53E3E',
  dangerBg: '#FEF2F2',
  warm: '#F59E0B',
  warmBg: '#FFFBEB',
} as const;

const BANNER_GRADIENT: [string, string, string] = ['#2B5BA8', '#312e81', '#1e1b4b'];
const AVATAR_GRADIENT: [string, string] = ['#6BA3E0', '#2B5BA8'];

const AVATAR_SIZE = 108;
const BANNER_H = 165;

function getRuoloTag(ruolo?: string) {
  if (!ruolo) return { label: 'Utente', bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
  const r = ruolo.toUpperCase();
  if (r.includes('ADMIN'))      return { label: 'Admin',      bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
  if (r.includes('PROFESSORE')) return { label: 'Professore', bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
  if (r.includes('STUDENTE'))   return { label: 'Studente',   bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
  return { label: ruolo, bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDataOra(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postVote}>
        <Text style={styles.postVoteStar}>★</Text>
        <Text style={styles.postVoteCount}>{post.numeroLike ?? 0}</Text>
      </View>
      <View style={styles.postBody}>
        <Text style={styles.postMeta} numberOfLines={1}>
          {post.nomeUtente ?? ''}
          <Text style={styles.postHandle}>  @{post.usernameUtente}</Text>
          <Text style={styles.postDate}>  · {formatDataOra(post.dataOra)}</Text>
        </Text>
        <Text style={styles.postContent} numberOfLines={4}>{post.contenuto}</Text>
        <Text style={styles.postComments}>
          💬  {post.commenti?.length ?? 0} commenti
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { profile, isLoading: profileLoading, loadProfile } = useProfile();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute();
  const paramUsername = (route.params as { username?: string } | undefined)?.username;
  const isOwnProfile = !paramUsername || paramUsername === user?.username;
  const targetUsername = paramUsername ?? user?.username ?? '';

  const [otherProfilo, setOtherProfilo] = useState<ProfiloDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seguito, setSeguito] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const profilo: ProfiloDto | null = isOwnProfile ? profile : otherProfilo;
  const isCurrentlyLoading = isOwnProfile ? profileLoading : loading;

  useEffect(() => {
    if (!targetUsername) return;
    setError('');

    if (isOwnProfile) {
      loadProfile(targetUsername).catch(() => setError('Impossibile caricare il profilo.'));
    } else {
      setLoading(true);
      setOtherProfilo(null);
      setSeguito(false);
      userService.getProfileByUsername(targetUsername)
        .then(data => {
          setOtherProfilo(data);
          setSeguito(data.seguito ?? false);
        })
        .catch(() => setError('Impossibile caricare il profilo.'))
        .finally(() => setLoading(false));
    }
  }, [targetUsername, isOwnProfile]);

  function handleLogout() {
    Alert.alert('Logout', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: logout },
    ]);
  }

  async function handleFollow() {
    setFollowLoading(true);
    try {
      if (seguito) {
        await userService.unfollowUser(targetUsername);
        setSeguito(false);
        setOtherProfilo(p => p ? { ...p, numSeguaci: Math.max(0, (p.numSeguaci ?? 1) - 1) } : p);
      } else {
        await userService.followUser(targetUsername);
        setSeguito(true);
        setOtherProfilo(p => p ? { ...p, numSeguaci: (p.numSeguaci ?? 0) + 1 } : p);
      }
    } catch {
      // no change on error
    } finally {
      setFollowLoading(false);
    }
  }

  if (isCurrentlyLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Caricamento profilo…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const ruoloTag = getRuoloTag(profilo?.ruolo ?? (isOwnProfile ? user?.ruoli?.[0]?.nome : undefined));
  const displayName = profilo
    ? `${profilo.nome} ${profilo.cognome}`
    : `${user?.nome ?? ''} ${user?.cognome ?? ''}`;
  const username = profilo?.username ?? targetUsername;
  const avatarLetter = (username[0] ?? '?').toUpperCase();
  const posts: Post[] = (profilo?.posts as Post[]) ?? [];

  return (
    <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>

      {/* Banner + Avatar */}
      <View style={styles.bannerContainer}>
        <LinearGradient
          colors={BANNER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerOrb} />
        </LinearGradient>

        <View style={styles.avatarOuter}>
          {profilo?.fotoProfilo ? (
            <Image source={{ uri: profilo.fotoProfilo }} style={styles.avatarImg} />
          ) : (
            <LinearGradient colors={AVATAR_GRADIENT} style={styles.avatarGradient}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </LinearGradient>
          )}
        </View>
      </View>

      <View style={styles.content}>

        {/* Identity row */}
        <View style={styles.identityRow}>
          <View style={styles.identityLeft}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.usernameText}>@{username}</Text>
            <View style={[styles.roleTag, { backgroundColor: ruoloTag.bg, borderColor: ruoloTag.border }]}>
              <Text style={[styles.roleTagText, { color: ruoloTag.text }]}>{ruoloTag.label}</Text>
            </View>
          </View>
          {isOwnProfile ? (
            <View style={styles.ownActions}>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Text style={styles.editProfileBtnText}>Modifica</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.savedBtn}
                onPress={() => navigation.navigate('SavedPosts')}
              >
                <Text style={styles.savedBtnText}>🔖 Salvati</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Esci</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.followBtn, seguito && styles.followBtnActive]}
              onPress={handleFollow}
              disabled={followLoading}
            >
              {followLoading
                ? <ActivityIndicator size="small" color={seguito ? C.primary : '#fff'} />
                : <Text style={[styles.followBtnText, seguito && styles.followBtnTextActive]}>
                    {seguito ? 'Segui già' : 'Segui'}
                  </Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Stats 2x2 */}
        <View style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <StatCell value={profilo?.numPost ?? 0}    label="Post" />
            <View style={styles.statDividerV} />
            <StatCell value={profilo?.numLike ?? 0}    label="Like" />
          </View>
          <View style={styles.statDividerH} />
          <View style={styles.statsGrid}>
            <StatCell value={profilo?.numSeguaci ?? 0} label="Seguaci" />
            <View style={styles.statDividerV} />
            <StatCell value={profilo?.numSeguiti ?? 0} label="Seguiti" />
          </View>
        </View>

        {/* Bio */}
        {!!profilo?.bio && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bioText}>{profilo.bio}</Text>
          </View>
        )}

        {/* Membro dal */}
        <View style={styles.memberRow}>
          <Text style={styles.memberIcon}>🗓</Text>
          <Text style={styles.memberText}>
            Membro dal{' '}
            <Text style={styles.memberDate}>{formatDate(profilo?.memberDal as string)}</Text>
          </Text>
        </View>

        {/* Post recenti */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Text style={styles.sectionTitle}>Post</Text>
            <View style={styles.postsBadge}>
              <Text style={styles.postsBadgeText}>{profilo?.numPost ?? 0}</Text>
            </View>
          </View>

          {posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyEmoji}>😊</Text>
              <Text style={styles.emptyText}>Nessun post ancora.</Text>
            </View>
          ) : (
            posts.map((post) => <PostCard key={String(post.id)} post={post} />)
          )}
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { color: C.textSoft, fontSize: 14 },
  errorText: { color: C.danger, fontSize: 14, textAlign: 'center' },

  bannerContainer: { position: 'relative' },
  banner: { height: BANNER_H },
  bannerOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  avatarOuter: {
    position: 'absolute',
    bottom: -(AVATAR_SIZE / 2),
    left: 20,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: C.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 42, fontWeight: '800', letterSpacing: -1 },

  content: {
    paddingTop: AVATAR_SIZE / 2 + 16,
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 14,
  },

  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  identityLeft: { gap: 4, flex: 1 },
  displayName: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.4 },
  usernameText: { fontSize: 14, color: C.textSoft },
  roleTag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  roleTagText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  ownActions: { gap: 8, alignItems: 'flex-end' },
  editProfileBtn: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginTop: 4,
  },
  editProfileBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  savedBtn: {
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  savedBtnText: { color: C.primary, fontSize: 13, fontWeight: '600' },
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: C.danger,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  logoutBtnText: { color: C.danger, fontSize: 13, fontWeight: '600' },
  followBtn: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  followBtnActive: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  followBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  followBtnTextActive: { color: C.primary },

  statsCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statsGrid: { flexDirection: 'row' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statValue: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  statDividerV: { width: 1, backgroundColor: C.border, marginVertical: 10 },
  statDividerH: { height: 1, backgroundColor: C.border },

  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  bioText: { fontSize: 14, color: C.textSoft, lineHeight: 21 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  memberIcon: { fontSize: 15 },
  memberText: { fontSize: 13, color: C.textSoft },
  memberDate: { fontWeight: '600', color: C.text },

  postsSection: { gap: 10 },
  postsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postsBadge: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  postsBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyEmoji: { fontSize: 28 },
  emptyText: { fontSize: 14, color: C.textSoft },

  postCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  postVote: {
    width: 52,
    backgroundColor: C.warmBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#FDE68A',
  },
  postVoteStar: { fontSize: 14, color: C.warm },
  postVoteCount: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  postBody: { flex: 1, padding: 12, gap: 4 },
  postMeta: { fontSize: 12, fontWeight: '600', color: C.text },
  postHandle: { fontWeight: '400', color: C.textSoft },
  postDate: { fontWeight: '400', color: C.textMuted },
  postContent: { fontSize: 13, color: C.text, lineHeight: 19 },
  postComments: { fontSize: 11, color: C.textSoft, marginTop: 4 },
});
