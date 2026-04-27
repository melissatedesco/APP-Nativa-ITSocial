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
import { ProfiloDto } from '../../types';
import { userService } from '../../services/userService';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfiloDto[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const users = await userService.searchUsers(text);
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Cerca utenti..."
        value={query}
        onChangeText={handleSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {loading && <ActivityIndicator color="#1a73e8" style={{ marginTop: 16 }} />}
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {item.nome?.[0] ?? '?'}
                {item.cognome?.[0] ?? ''}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>
                {item.nome} {item.cognome}
              </Text>
              <Text style={styles.userHandle}>@{item.username}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: { color: '#fff', fontWeight: 'bold' },
  userName: { fontSize: 15, fontWeight: '600' },
  userHandle: { fontSize: 13, color: '#888' },
});
