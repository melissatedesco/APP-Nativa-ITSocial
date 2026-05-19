import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { userService } from '../../services/userService';
import { ProfiloDto, MainStackParamList } from '../../types';

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { color: C.textSoft, fontSize: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
  avatarGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 18 },
  avatarImg: { width: '100%', height: '100%' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: C.text },
  username: { fontSize: 13, color: C.textSoft, marginTop: 1 },
});

export default function UserListScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { username, type } = route.params as { title: string; username: string; type: 'seguaci' | 'seguiti' };

  const [users, setUsers] = useState<ProfiloDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = type === 'seguaci' ? userService.getSeguaci : userService.getSeguiti;
    fetch(username)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username, type]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;
  }

  if (users.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="account-off-outline" size={48} color={C.textMuted} />
        <Text style={styles.emptyText}>Nessun utente trovato</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.page}
      data={users}
      keyExtractor={(item) => String(item.id ?? item.username)}
      renderItem={({ item }) => {
        const letter = (item.username?.[0] ?? '?').toUpperCase();
        return (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('UserProfile', { username: item.username })}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              {item.fotoProfilo ? (
                <ExpoImage source={{ uri: item.fotoProfilo }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.avatarGrad}>
                  <Text style={styles.avatarLetter}>{letter}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.nome} {item.cognome}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
          </TouchableOpacity>
        );
      }}
    />
  );
}
