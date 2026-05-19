import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { userService } from '../../services/userService';
import { MEDIA_BASE_URL } from '../../services/api';

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}g`;
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { color: C.textSoft, fontSize: 14 },
  card: {
    backgroundColor: C.card, marginHorizontal: 12, marginVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  cardImg: { width: '100%', height: 180 },
  cardBody: { padding: 12, gap: 6 },
  cardContent: { fontSize: 14, color: C.text, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardMetaText: { fontSize: 12, color: C.textSoft },
  cardLikes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

export default function PostListScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const route = useRoute();
  const { username, type } = route.params as { title: string; username: string; type: 'posts' | 'liked' };

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = type === 'liked' ? userService.getLikedPosts : userService.getUserPosts;
    fetch(username)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username, type]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;
  }

  if (posts.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="post-outline" size={48} color={C.textMuted} />
        <Text style={styles.emptyText}>Nessun post trovato</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.page}
      data={posts}
      keyExtractor={(item) => String(item.id ?? item.idPost)}
      contentContainerStyle={{ paddingVertical: 8 }}
      renderItem={({ item }) => {
        const firstImg = item.allegati?.find((a: any) => a.tipo === 'IMAGE');
        return (
          <View style={styles.card}>
            {firstImg && (
              <ExpoImage
                source={{ uri: MEDIA_BASE_URL + firstImg.url }}
                style={styles.cardImg}
                contentFit="cover"
              />
            )}
            <View style={styles.cardBody}>
              {!!item.contenuto && (
                <Text style={styles.cardContent} numberOfLines={3}>{item.contenuto}</Text>
              )}
              <View style={styles.cardMeta}>
                <View style={styles.cardLikes}>
                  <MaterialCommunityIcons name="star" size={13} color="#f59e0b" />
                  <Text style={styles.cardMetaText}>{item.numeroLike ?? 0}</Text>
                </View>
                <Text style={styles.cardMetaText}>{timeAgo(item.dataOra)}</Text>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}
