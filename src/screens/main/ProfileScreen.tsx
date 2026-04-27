import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { session, logout } = useAuth();

  async function handleLogout() {
    Alert.alert('Logout', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {session?.nome?.[0]}
          {session?.cognome?.[0]}
        </Text>
      </View>
      <Text style={styles.name}>
        {session?.nome} {session?.cognome}
      </Text>
      <Text style={styles.username}>@{session?.username}</Text>

      {session?.ruoli && session.ruoli.length > 0 && (
        <Text style={styles.role}>{session.ruoli[0].nome}</Text>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  username: { fontSize: 15, color: '#666', marginBottom: 8 },
  role: { fontSize: 13, color: '#1a73e8', marginBottom: 24 },
  logoutButton: {
    marginTop: 'auto',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e53935',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  logoutText: { color: '#e53935', fontSize: 16, fontWeight: '600' },
});
