import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, ThemeColors, getRuoloBadge } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  panel: {
    width: 300,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  profileCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 14, fontWeight: '700', color: C.text },
  profileUsername: { fontSize: 12, color: C.textSoft },
  badge: {
    alignSelf: 'flex-start', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, marginTop: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  profileBtn: {
    backgroundColor: C.primary, borderRadius: 10,
    paddingVertical: 9, alignItems: 'center',
  },
  profileBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  quickCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  quickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  quickRowLast: {
    borderBottomWidth: 0,
  },
  quickLabel: { flex: 1, fontSize: 14, color: C.text, fontWeight: '500' },
  footerText: {
    fontSize: 11, color: C.textMuted, lineHeight: 18,
  },
});

const QUICK_LINKS = [
  { icon: 'bookmark-outline' as const, label: 'Post salvati', screen: 'SavedPosts' as const },
  { icon: 'school-outline' as const, label: 'La mia classe', screen: 'MyClass' as const },
  { icon: 'star-four-points-outline' as const, label: 'SmarTina AI', screen: 'SmartinaChat' as const },
  { icon: 'account-group-outline' as const, label: 'Messaggi', screen: 'Messages' as const },
];

export function WebRightPanel() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const nome = (user as any)?.nome ?? (user as any)?.username ?? '?';
  const cognome = (user as any)?.cognome ?? '';
  const username = (user as any)?.username ?? '';
  const ruoloNome = (user as any)?.ruolo?.nome ?? '';
  const ruoloTag = getRuoloBadge(ruoloNome);
  const letter = nome[0].toUpperCase();

  return (
    <View style={styles.panel}>
      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View>
          <Text style={styles.sectionTitle}>Il tuo profilo</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{letter}</Text>
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{nome}{cognome ? ` ${cognome}` : ''}</Text>
                <Text style={styles.profileUsername}>@{username}</Text>
                {!!ruoloNome && (
                  <View style={[styles.badge, { backgroundColor: ruoloTag.bg, borderColor: ruoloTag.border }]}>
                    <Text style={[styles.badgeText, { color: ruoloTag.text }]}>{ruoloTag.label}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => username && navigation.navigate('UserProfile', { username })}
              activeOpacity={0.8}
            >
              <Text style={styles.profileBtnText}>Vai al profilo →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick links */}
        <View>
          <Text style={styles.sectionTitle}>Accesso rapido</Text>
          <View style={styles.quickCard}>
            {QUICK_LINKS.map((link, i) => (
              <TouchableOpacity
                key={link.screen}
                style={[styles.quickRow, i === QUICK_LINKS.length - 1 && styles.quickRowLast]}
                onPress={() => navigation.navigate(link.screen as any)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name={link.icon} size={18} color={C.primary} />
                <Text style={styles.quickLabel}>{link.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={C.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          ITSocial · Piattaforma scolastica{'\n'}© 2025 ITSocial
        </Text>
      </ScrollView>
    </View>
  );
}
