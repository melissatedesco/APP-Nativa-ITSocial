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
import { useFocusEffect } from '@react-navigation/native';
import { MEDIA_BASE_URL } from '../../services/api';
import { salvataggioService } from '../../services/salvataggioService';
import { Post } from '../../types';

const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSoft: '#64748B',
  textMuted: '#94A3B8',
  primary: '#4A8FD4',
  warm: '#F59E0B',
  warmBg: '#FFFBEB',
  danger: '#E53E3E',
} as const;

const AVATAR_GRADIENT: [string, string] = ['#6BA3E0', '#2B5BA8'];

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

function getRuoloColor(ruolo?: string): string {
  if (!ruolo) return C.textMuted;
  const r = ruolo.toUpperCase();
  if (r.includes('PROFESSORE')) return '#1E40AF';
  if (r.includes('STUDENTE'))   return '#065F46';
  if (r.includes('ADMIN'))      return '#92400E';
  return C.textMuted;
}

function SavedPostCard({
  post,
  onUnsave,
}: {
  post: Post;
  onUnsave: (id: number) => void;
}) {
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
      {/* Header */}
      <View style={styles.cardHeader}>
        <LinearGradient colors={AVATAR_GRADIENT} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <View style={styles.headerInfo}>
          <Text style={styles.authorName} numberOfLines={1}>{post.nomeUtente ?? 'Utente'}</Text>
          <Text style={styles.authorMeta}>
            <Text style={{ color: getRuoloColor(post.ruoloUtente) }}>
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
          <Text style={styles.unsaveBtnText}>🔖</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={styles.content} numberOfLines={6}>{post.contenuto}</Text>

      {/* Image preview (single) */}
      {images.length > 0 && (
        <ExpoImage
          source={{ uri: MEDIA_BASE_URL + images[0].url }}
          style={styles.imagePreview}
          contentFit="cover"
        />
      )}

      {/* Footer stats */}
      <View style={styles.cardFooter}>
        <Text style={styles.stat}>★  {post.numeroLike ?? 0}</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.stat}>💬  {post.numeroCommenti ?? post.commenti?.length ?? 0}</Text>
        {images.length > 1 && (
          <>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.stat}>📷  {images.length}</Text>
          </>
        )}
      </View>
    </View>
  );
}

export default function SavedPostsScreen() {
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
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
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
          <Text style={styles.emptyEmoji}>🔖</Text>
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  listContent: { padding: 16, paddingBottom: 40 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 14, color: C.danger, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: C.primary,
    borderRadius: 999,
  },
  retryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  postCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
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
  unsaveBtnText: { fontSize: 18 },

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
    borderRadius: 12,
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
  statDot: { fontSize: 12, color: C.textMuted },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 13, color: C.textSoft, textAlign: 'center', paddingHorizontal: 32 },
});
