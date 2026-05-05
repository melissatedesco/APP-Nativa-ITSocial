import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/UserContext';
import { useTheme, ThemeColors, getRuoloBadge } from '../../context/ThemeContext';
import { userService } from '../../services/userService';
import { MEDIA_BASE_URL } from '../../services/api';
import { ProfiloDto, Post, MainStackParamList } from '../../types';

const BANNER_GRADIENT: [string, string, string] = ['#00bcd4', '#0097a7', '#006064'];
const AVATAR_SIZE = 108;
const BANNER_H = 165;
const GRID_GAP = 2;

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function StatCell({ value, label, styles }: { value: number; label: string; styles: any }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PostGridItem({ post, cellSize, styles }: { post: Post; cellSize: number; styles: any }) {
  const firstImage = post.allegati?.find(a => a.tipo === 'IMAGE');
  return (
    <View style={[styles.gridCell, { width: cellSize, height: cellSize }]}>
      {firstImage ? (
        <ExpoImage
          source={{ uri: MEDIA_BASE_URL + firstImage.url }}
          style={styles.gridImage}
          contentFit="cover"
        />
      ) : (
        <View style={styles.gridTextCell}>
          <Text style={styles.gridText} numberOfLines={5}>{post.contenuto}</Text>
        </View>
      )}
      <View style={styles.gridOverlay}>
        <MaterialCommunityIcons name="star" size={10} color="#f59e0b" />
        <Text style={styles.gridLikeText}>{post.numeroLike ?? 0}</Text>
      </View>
    </View>
  );
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { color: C.textSoft, fontSize: 14 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center' },
  errorText: { color: C.textSoft, fontSize: 13, textAlign: 'center', lineHeight: 20 },
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

  identityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  identityLeft: { gap: 4, flex: 1 },
  displayName: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.4 },
  usernameText: { fontSize: 14, color: C.textSoft },
  roleTag: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  roleTagText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  ownActions: { gap: 8, alignItems: 'flex-end' },
  editProfileBtn: { backgroundColor: C.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7, marginTop: 4 },
  editProfileBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  savedBtn: { borderWidth: 1.5, borderColor: C.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  savedBtnText: { color: C.primary, fontSize: 13, fontWeight: '600' },
  logoutBtn: { borderWidth: 1.5, borderColor: C.danger, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  logoutBtnText: { color: C.danger, fontSize: 13, fontWeight: '600' },
  followBtn: { backgroundColor: C.primary, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 8, marginTop: 4, minWidth: 80, alignItems: 'center' },
  followBtnActive: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.primary },
  followBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  followBtnTextActive: { color: C.primary },

  // Theme switch row
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  themeLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: C.text },

  statsCard: { backgroundColor: C.card, borderRadius: 15, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 },
  statsGrid: { flexDirection: 'row' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statValue: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '600', color: C.textSoft, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  statDividerV: { width: 1, backgroundColor: C.border, marginVertical: 10 },
  statDividerH: { height: 1, backgroundColor: C.border },

  sectionCard: { backgroundColor: C.card, borderRadius: 15, borderWidth: 1, borderColor: C.border, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  bioText: { fontSize: 14, color: C.textSoft, lineHeight: 21 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  memberIcon: { fontSize: 15 },
  memberText: { fontSize: 13, color: C.textSoft },
  memberDate: { fontWeight: '600', color: C.text },

  postsSection: { gap: 10 },
  postsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postsBadge: { backgroundColor: C.primary, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  postsBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  emptyPosts: { alignItems: 'center', paddingVertical: 40, gap: 10, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border },
  emptyText: { fontSize: 14, color: C.textSoft },

  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  gridCell: { overflow: 'hidden', borderRadius: 6, backgroundColor: C.border, position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridTextCell: { flex: 1, backgroundColor: C.inputBg, padding: 8, justifyContent: 'center' },
  gridText: { fontSize: 10, color: C.textSoft, lineHeight: 15 },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.42)', paddingHorizontal: 5, paddingVertical: 3 },
  gridLikeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
});

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { profile, isLoading: profileLoading, loadProfile } = useProfile();
  const { colors: C, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(C);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - 32 - GRID_GAP * 2) / 3);
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
        .then(data => { setOtherProfilo(data); setSeguito(data.seguito ?? false); })
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
    } catch { /* no change on error */ }
    finally { setFollowLoading(false); }
  }

  function handleRetry() {
    setError('');
    if (isOwnProfile) {
      loadProfile(targetUsername).catch(() => setError('Impossibile caricare il profilo.'));
    } else {
      setLoading(true);
      setOtherProfilo(null);
      setSeguito(false);
      userService.getProfileByUsername(targetUsername)
        .then(data => { setOtherProfilo(data); setSeguito(data.seguito ?? false); })
        .catch(() => setError('Impossibile caricare il profilo.'))
        .finally(() => setLoading(false));
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
        <MaterialCommunityIcons name="account-circle-outline" size={56} color={C.textMuted} />
        <Text style={styles.errorTitle}>Qualcosa è andato storto</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
          <MaterialCommunityIcons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.retryBtnText}>Ricarica</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ruoloTag = getRuoloBadge(profilo?.ruolo ?? (isOwnProfile ? user?.ruoli?.[0]?.nome : undefined));
  const displayName = profilo
    ? `${profilo.nome} ${profilo.cognome}`
    : `${user?.nome ?? ''} ${user?.cognome ?? ''}`;
  const username = profilo?.username ?? targetUsername;
  const avatarLetter = (username[0] ?? '?').toUpperCase();
  const posts: Post[] = (profilo?.posts as Post[]) ?? [];
  const AVATAR_GRADIENT: [string, string] = [C.primary, C.primaryDark];

  return (
    <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>

      {/* Banner + Avatar */}
      <View style={styles.bannerContainer}>
        <LinearGradient colors={BANNER_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <View style={styles.bannerOrb} />
        </LinearGradient>
        <View style={styles.avatarOuter}>
          {profilo?.fotoProfilo ? (
            <ExpoImage source={{ uri: profilo.fotoProfilo }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <LinearGradient colors={AVATAR_GRADIENT} style={styles.avatarGradient}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </LinearGradient>
          )}
        </View>
      </View>

      <View style={styles.content}>

        {/* Identity */}
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
              <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.editProfileBtnText}>Modifica</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.savedBtn} onPress={() => navigation.navigate('SavedPosts')}>
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

        {/* Theme switch — solo profilo proprio */}
        {isOwnProfile && (
          <View style={styles.themeRow}>
            <MaterialCommunityIcons
              name={isDark ? 'weather-night' : 'white-balance-sunny'}
              size={18}
              color={C.primary}
            />
            <Text style={styles.themeLabel}>{isDark ? 'Modalità scura' : 'Modalità chiara'}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#e0f7fa', true: '#1e3448' }}
              thumbColor={C.primary}
              ios_backgroundColor="#e0f7fa"
            />
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <StatCell value={profilo?.numPost ?? 0}    label="Post"    styles={styles} />
            <View style={styles.statDividerV} />
            <StatCell value={profilo?.numLike ?? 0}    label="Like"    styles={styles} />
          </View>
          <View style={styles.statDividerH} />
          <View style={styles.statsGrid}>
            <StatCell value={profilo?.numSeguaci ?? 0} label="Seguaci" styles={styles} />
            <View style={styles.statDividerV} />
            <StatCell value={profilo?.numSeguiti ?? 0} label="Seguiti" styles={styles} />
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

        {/* Post grid */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Text style={styles.sectionTitle}>Post</Text>
            <View style={styles.postsBadge}>
              <Text style={styles.postsBadgeText}>{profilo?.numPost ?? 0}</Text>
            </View>
          </View>
          {posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <MaterialCommunityIcons name="image-multiple-outline" size={36} color={C.textMuted} />
              <Text style={styles.emptyText}>Nessun post ancora.</Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {posts.map(post => (
                <PostGridItem key={String(post.id)} post={post} cellSize={cellSize} styles={styles} />
              ))}
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
