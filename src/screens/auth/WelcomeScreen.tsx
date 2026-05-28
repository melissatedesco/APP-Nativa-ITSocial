import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'> };

const FEATURES: { icon: MCIName; color: string; bg: string; title: string; desc: string }[] = [
  { icon: 'account-network',   color: '#4A8FD4', bg: '#EFF6FF', title: 'Networking Studentesco', desc: 'Connettiti con studenti del tuo corso o di altri ITS in tutta Italia.' },
  { icon: 'share-variant',     color: '#F59E0B', bg: '#FFF7ED', title: 'Condivisione Risorse',   desc: 'Condividi appunti, materiali di studio e link utili con la community.' },
  { icon: 'book-open-variant', color: '#22C55E', bg: '#F0FDF4', title: 'Supporto allo Studio',   desc: 'Trova aiuto per esami, progetti e preparati al mondo del lavoro.' },
  { icon: 'auto-fix',          color: '#0EA5E9', bg: '#F0F9FF', title: 'SmarTina AI',            desc: 'La tua assistente intelligente per corsi, scadenze e ogni domanda ITS.' },
  { icon: 'briefcase-outline', color: '#F59E0B', bg: '#FFF7ED', title: 'Stage & Lavoro',         desc: 'Scopri opportunità di stage e aziende che cercano studenti ITS.' },
  { icon: 'forum',             color: '#4A8FD4', bg: '#EFF6FF', title: 'Community ITS',          desc: 'Un social pensato solo per gli studenti ITS, sicuro e verticale.' },
];

const makeStyles = (C: ThemeColors, topInset: number) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  // ── Nav ──────────────────────────────────────────────────────────────────────
  navBlock: {
    backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingTop: topInset + 8,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 10,
  },
  nav: { alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navLogo: { width: 100, height: 100 },
  brandName: { fontWeight: '800', fontSize: 18, letterSpacing: -0.4, color: C.primary },
  subNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 20, paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1, borderColor: C.border,
  },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  themeToggle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card,
  },
  ghostBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, borderWidth: 1, borderColor: C.border },
  ghostBtnText: { fontSize: 13, fontWeight: '600', color: C.text },
  primaryBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: '#4A8FD4' },
  primaryBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  hero: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20,
  },
  chipText: { fontSize: 16, fontWeight: '700', color: '#2B5BA8' },
  h1: {
    fontSize: 30, fontWeight: '800', textAlign: 'center',
    lineHeight: 38, letterSpacing: -0.6, color: C.text, marginBottom: 16,
  },
  accent: { color: '#4A8FD4' },
  lead: {
    fontSize: 15, textAlign: 'center', lineHeight: 24,
    color: C.textSoft, marginBottom: 28,
  },
  heroCta: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 12, marginBottom: 32,
  },
  ctaPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#4A8FD4', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 9999,
    shadowColor: '#4A8FD4', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30, shadowRadius: 16, elevation: 4,
  },
  ctaPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ctaOutline: {
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 9999, borderWidth: 1.5, borderColor: C.border,
  },
  ctaOutlineText: { fontSize: 14, fontWeight: '600', color: C.text },
  heroImg: { width: '100%', height: 200, borderRadius: 20 },

  // ── SmarTina ─────────────────────────────────────────────────────────────────
  smartinaWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  smartinaBanner: {
    borderRadius: 24, padding: 20,
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
  },
  smartinaImg: { width: 72, height: 72, borderRadius: 36, flexShrink: 0 },
  smartinaText: { flex: 1 },
  chipLight: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6,
  },
  chipLightText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  smartinaTitle: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 6 },
  smartinaDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginBottom: 12 },
  smartinaBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)', borderRadius: 9999,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  smartinaBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ── Features ─────────────────────────────────────────────────────────────────
  featSection: { paddingHorizontal: 20, paddingVertical: 32 },
  sectionTitle: {
    fontSize: 22, fontWeight: '800', textAlign: 'center',
    letterSpacing: -0.4, color: C.text, marginBottom: 6,
  },
  sectionSub: {
    fontSize: 14, textAlign: 'center', lineHeight: 22,
    color: C.textSoft, marginBottom: 24,
  },
  featGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featCard: {
    width: '48.5%', marginBottom: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 16, padding: 16,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  featIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  featTitle: { fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 18, marginBottom: 4 },
  featDesc: { fontSize: 12, color: C.textSoft, lineHeight: 17 },

  // ── CTA ──────────────────────────────────────────────────────────────────────
  ctaSection: { paddingHorizontal: 20, paddingBottom: 32 },
  ctaInner: { borderRadius: 24, padding: 32, alignItems: 'center' },
  ctaTitle: {
    fontSize: 22, fontWeight: '800', color: '#fff',
    textAlign: 'center', letterSpacing: -0.4, marginBottom: 8,
  },
  ctaSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 20 },
  ctaWhiteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 9999,
  },
  ctaWhiteBtnText: { fontSize: 14, fontWeight: '700', color: '#2B5BA8' },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 24, paddingVertical: 20,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: C.textMuted },
});

export default function WelcomeScreen({ navigation }: Props) {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const { top } = useSafeAreaInsets();
  const S = makeStyles(C, top);

  return (
    <ScrollView style={S.page} showsVerticalScrollIndicator={false}>

      {/* Nav block — logo + azioni in un unico sfondo coerente */}
      <View style={S.navBlock}>
        <View style={S.nav}>
          <Image source={require('../../../assets/logo-itsocial.png')} style={S.navLogo} resizeMode="contain" />
        </View>
        <View style={S.subNav}>
          <TouchableOpacity style={S.themeToggle} onPress={toggleTheme} activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'weather-night'}
              size={20}
              color={C.textSoft}
            />
          </TouchableOpacity>
          <TouchableOpacity style={S.ghostBtn} onPress={() => navigation.navigate('Login')}
            accessibilityRole="button" accessibilityLabel="Accedi al tuo account"
          >
            <Text style={S.ghostBtnText}>Accedi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.primaryBtn} onPress={() => navigation.navigate('Register')}
            accessibilityRole="button" accessibilityLabel="Registrati su ITSocial"
          >
            <Text style={S.primaryBtnText}>Registrati</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero */}
      <View style={S.hero}>
        <View style={S.chip}>
          <MaterialCommunityIcons name="star-four-points" size={16} color="#2B5BA8" />
          <Text style={S.chipText}>Il social degli studenti ITS</Text>
        </View>
        <Text style={S.h1}>
          {'Connettiti con chi sta\n'}
          <Text style={S.accent}>seguendo il tuo percorso</Text>
        </Text>
        <Text style={S.lead}>
          ITSocial è la piattaforma pensata per gli studenti ITS di tutta Italia. Condividi, impara e trova opportunità di stage — tutto in un posto.
        </Text>
        <View style={S.heroCta}>
          <TouchableOpacity style={S.ctaPrimary} onPress={() => navigation.navigate('Register')}>
            <MaterialCommunityIcons name="rocket-launch" size={16} color="#fff" />
            <Text style={S.ctaPrimaryText}>Entra nella community</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.ctaOutline} onPress={() => navigation.navigate('Login')}>
            <Text style={S.ctaOutlineText}>Ho già un account</Text>
          </TouchableOpacity>
        </View>
        <Image source={require('../../../assets/grafica.png')} style={S.heroImg} resizeMode="contain" />
      </View>

      {/* SmarTina */}
      <View style={S.smartinaWrap}>
        <LinearGradient
          colors={['#2B5BA8', '#0f2545']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={S.smartinaBanner}
        >
          <Image source={require('../../../assets/smartina.png')} style={S.smartinaImg} resizeMode="cover" />
          <View style={S.smartinaText}>
            <View style={S.chipLight}>
              <MaterialCommunityIcons name="auto-fix" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={S.chipLightText}>Assistente AI</Text>
            </View>
            <Text style={S.smartinaTitle}>Ciao, sono SmarTina!</Text>
            <Text style={S.smartinaDesc}>
              La tua assistente digitale ITS. Chiedimi dei corsi, delle scadenze, come muoverti nel social.
            </Text>
            <TouchableOpacity style={S.smartinaBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={S.smartinaBtnText}>Provala subito →</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Features */}
      <View style={S.featSection}>
        <Text style={S.sectionTitle}>Tutto quello che ti serve</Text>
        <Text style={S.sectionSub}>Funzionalità pensate per la vita dello studente ITS</Text>
        <View style={S.featGrid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={S.featCard}>
              <View style={[S.featIcon, { backgroundColor: f.bg }]}>
                <MaterialCommunityIcons name={f.icon} size={22} color={f.color} />
              </View>
              <Text style={S.featTitle}>{f.title}</Text>
              <Text style={S.featDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={S.ctaSection}>
        <LinearGradient
          colors={['#2B5BA8', '#0f2545']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={S.ctaInner}
        >
          <Text style={S.ctaTitle}>Entra a far parte della community</Text>
          <Text style={S.ctaSub}>Inizia oggi il tuo percorso di networking — è gratis.</Text>
          <TouchableOpacity style={S.ctaWhiteBtn} onPress={() => navigation.navigate('Register')}>
            <MaterialCommunityIcons name="account-plus" size={16} color="#2B5BA8" />
            <Text style={S.ctaWhiteBtnText}>Crea il tuo account</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View style={S.footer}>
        <Text style={S.footerText}>© 2025 ITSocial · Tutti i diritti riservati</Text>
      </View>

    </ScrollView>
  );
}
