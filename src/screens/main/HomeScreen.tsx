import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Post } from '../../types';
import { postService } from '../../services/postService';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadFeed() {
    try {
      const data = await postService.getFeed();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadFeed();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nessun post nel feed</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.postCard}>
          <Text style={styles.author}>
            {item.nomeUtente ?? 'Utente'}{' '}
            <Text style={styles.handle}>@{item.usernameUtente ?? ''}</Text>
          </Text>
          <Text style={styles.content}>{item.contenuto}</Text>
          <Text style={styles.meta}>
            {item.numeroLike ?? 0} mi piace · {item.commenti?.length ?? 0} commenti
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, flexGrow: 1 },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  author: { fontWeight: '700', fontSize: 15, marginBottom: 6 },
  handle: { fontWeight: '400', color: '#888', fontSize: 13 },
  content: { fontSize: 14, color: '#333', lineHeight: 20 },
  meta: { marginTop: 10, fontSize: 12, color: '#999' },
  emptyText: { color: '#999', fontSize: 16 },
});
