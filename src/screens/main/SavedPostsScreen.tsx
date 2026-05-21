import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useFocusEffect } from '@react-navigation/native';
import { MEDIA_BASE_URL } from '../../services/api';
import { salvataggioService } from '../../services/salvataggioService';
import { Post } from '../../types';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'ora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}g`;
}

function getRuoloColor(ruolo?: string, C?: ThemeColors): string {
  if (!ruolo) return C?.textMuted ?? '#94A3B8';
  const r = ruolo.toUpperCase();
  if (r.includes('PROFESSORE')) return '#1E40AF';
  if (r.includes('STUDENTE'))   return '#065F46';
  if (r.includes('ADMIN'))      return '#92400E';
  return C?.textMuted ?? '#94A3B8';
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
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  postCard: {
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  headerInfo: { flex: 1, gap: 2 },
  authorName: { fontSize: 14, fontWeight: '700', color: C.text },
  authorMeta: { fontSize: 11, color: C.textMuted },
  unsaveBtn: { padding: 4 },

  content: {
    fontSize: 14,
    color: C.text,
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  imagePreview: {
    marginHorizontal: 14,
    marginBottom: 10,
    height: 180,
    borderRadius: 10,
    backgroundColor: C.border,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  stat: { fontSize: 12, color: C.textSoft, fontWeight: '500' },
  statDivider: { width: 1, height: 12, backgroundColor: C.border, marginHorizontal: 2 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 13, color: C.textSoft, textAlign: 'center', paddingHorizontal: 32 },
});

function SavedPostCard({ post, onUnsave }: { post: Post; onUnsave: (id: number) => void }) {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const AVATAR_GRADIENT: [string, string] = [C.primary, C.primaryDark];
  const initials = (post.nomeUtente ?? '?')[0].toUpperCase();
  const images = post.allegati?.filter(a => a.tipo === 'IMAGE') ?? [];

  function confirmUnsave() {
    Alert.alert('Rimuovi dai salvati', 'Vuoi rimuovere questo post dai salvati?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Rimuovi', style: 'destructive', onPress: () => onUnsave(post.id) },
    ]);
  }

  return (
    <View style={styles.postCard}>
      <View style={styles.cardHeader}>
        <LinearGradient colors={AVATAR_GRADIENT} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <View style={styles.headerInfo}>
          <Text style={styles.authorName} numberOfLines={1}>{post.nomeUtente ?? 'Utente'}</Text>
          <Text style={styles.authorMeta}>
            <Text style={{ color: getRuoloColor(post.ruoloUtente, C) }}>
              {post.ruoloUtente ? `${post.ruoloUtente}  ·  ` : ''}
            </Text>
            @{post.usernameUtente}{'  ·  '}{timeAgo(post.dataOra)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.unsaveBtn}
          onPress={confirmUnsave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="bookmark" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.content} numberOfLines={6}>{post.contenuto}</Text>

      {images.length > 0 && (
        <ExpoImage
          source={{ uri: MEDIA_BASE_URL + images[0].url }}
          style={styles.imagePreview}
          contentFit="cover"
        />
      )}

      <View style={styles.cardFooter}>
        <MaterialCommunityIcons name="star" size={14} color={C.warm} />
        <Text style={styles.stat}>{post.numeroLike ?? 0}</Text>
        <View style={styles.statDivider} />
        <MaterialCommunityIcons name="comment-outline" size={14} color={C.textSoft} />
        <Text style={styles.stat}>{post.numeroCommenti ?? post.commenti?.length ?? 0}</Text>
        {images.length > 1 && (
          <>
            <View style={styles.statDivider} />
            <MaterialCommunityIcons name="image-multiple-outline" size={14} color={C.textSoft} />
            <Text style={styles.stat}>{images.length}</Text>
          </>
        )}
      </View>
    </View>
  );
}

export default function SavedPostsScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await salvataggioService.mieiSalvataggiPosts();
      setPosts(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setError('Impossibile caricare i post salvati.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleUnsave(postId: number) {
    try {
      await salvataggioService.rimuovi(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch {
      Alert.alert('Errore', 'Impossibile rimuovere il post dai salvati.');
    }
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
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
          <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryBtnText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={item => String(item.id)}
      style={styles.page}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bookmark-outline" size={52} color={C.textMuted} />
          <Text style={styles.emptyTitle}>Nessun post salvato</Text>
          <Text style={styles.emptySubtitle}>
            Tocca il segnalibro su un post per salvarlo qui
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <SavedPostCard post={item} onUnsave={handleUnsave} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    />
  );
}
