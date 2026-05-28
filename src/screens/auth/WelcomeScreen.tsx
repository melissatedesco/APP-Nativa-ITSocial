import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'> };

// Cast per usare <video> HTML su web senza errori TS
const WebVideo = 'video' as any;

const FEATURES: { icon: MCIName; color: string; bg: string; title: string; desc: string }[] = [
  { icon: 'account-network',   color: '#4A8FD4', bg: '#EFF6FF', title: 'Networking Studentesco', desc: 'Connettiti con studenti del tuo corso o di altri ITS in tutta Italia.' },
  { icon: 'share-variant',     color: '#F59E0B', bg: '#FFF7ED', title: 'Condivisione Risorse',   desc: 'Condividi appunti, materiali di studio e link utili con la community.' },
  { icon: 'book-open-variant', color: '#22C55E', bg: '#F0FDF4', title: 'Supporto allo Studio',   desc: 'Trova aiuto per esami, progetti e preparati al mondo del lavoro.' },
  { icon: 'auto-fix',          color: '#0EA5E9', bg: '#F0F9FF', title: 'SmarTina AI',            desc: 'La tua assistente intelligente per corsi, scadenze e ogni domanda ITS.' },
  { icon: 'briefcase-outline', color: '#F59E0B', bg: '#FFF7ED', title: 'Stage & Lavoro',         desc: 'Scopri opportunità di stage e aziende che cercano studenti ITS.' },
  { icon: 'forum',             color: '#4A8FD4', bg: '#EFF6FF', title: 'Community ITS',          desc: 'Un social pensato solo per gli studenti ITS, sicuro e verticale.' },
];

// ─── Stili mobile ─────────────────────────────────────────────────────────────
const makeMobileStyles = (C: ThemeColors, topInset: number) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  navBlock: {
    backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingTop: topInset + 8, paddingBottom: 12,
    alignItems: 'center', gap: 10,
  },
  nav: { alignItems: 'center', justifyContent: 'center' },
  navLogo: { width: 100, height: 100 },
  subNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 20, paddingVertical: 10,
    marginHorizontal: 16, borderRadius: 999,
    borderWidth: 1, borderColor: C.border,
  },
  themeToggle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  ghostBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, borderWidth: 1, borderColor: C.border },
  ghostBtnText: { fontSize: 13, fontWeight: '600', color: C.text },
  primaryBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: '#4A8FD4' },
  primaryBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  hero: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20,
  },
  chipText: { fontSize: 16, fontWeight: '700', color: '#2B5BA8' },
  h1: { fontSize: 30, fontWeight: '800', textAlign: 'center', lineHeight: 38, letterSpacing: -0.6, color: C.text, marginBottom: 16 },
  accent: { color: '#4A8FD4' },
  lead: { fontSize: 15, textAlign: 'center', lineHeight: 24, color: C.textSoft, marginBottom: 28 },
  heroCta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 32 },
  ctaPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#4A8FD4', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 9999,
    shadowColor: '#4A8FD4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.30, shadowRadius: 16, elevation: 4,
  },
  ctaPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ctaOutline: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 9999, borderWidth: 1.5, borderColor: C.border },
  ctaOutlineText: { fontSize: 14, fontWeight: '600', color: C.text },
  heroImg: { width: '100%', height: 200, borderRadius: 20 },
  smartinaWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  smartinaBanner: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  smartinaImg: {
    width: 110, height: 135, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
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
  featSection: { paddingHorizontal: 20, paddingVertical: 32 },
  sectionTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4, color: C.text, marginBottom: 6 },
  sectionSub: { fontSize: 14, textAlign: 'center', lineHeight: 22, color: C.textSoft, marginBottom: 24 },
  featGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featCard: {
    width: '48.5%', marginBottom: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 16, padding: 16,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  featIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featTitle: { fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 18, marginBottom: 4 },
  featDesc: { fontSize: 12, color: C.textSoft, lineHeight: 17 },
  ctaSection: { paddingHorizontal: 20, paddingBottom: 32 },
  ctaInner: { borderRadius: 24, padding: 32, alignItems: 'center' },
  ctaTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.4, marginBottom: 8 },
  ctaSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 20 },
  ctaWhiteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 9999,
  },
  ctaWhiteBtnText: { fontSize: 14, fontWeight: '700', color: '#2B5BA8' },
  footer: {
    paddingHorizontal: 24, paddingVertical: 20,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, alignItems: 'center',
  },
  footerText: { fontSize: 12, color: C.textMuted },
});

// ─── Stili web (Instagram-style) ─────────────────────────────────────────────
const makeWebStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  navbar: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 14, paddingHorizontal: 24 },
  navInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 960, alignSelf: 'center', width: '100%' },
  navLogo: { width: 120, height: 40 },
  navActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  themeToggle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  loginBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 9999, borderWidth: 1.5, borderColor: C.border },
  loginBtnText: { fontSize: 14, fontWeight: '600', color: C.text },
  registerBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 9999, backgroundColor: '#4A8FD4' },
  registerBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  wrap: { maxWidth: 960, alignSelf: 'center', width: '100%', paddingHorizontal: 24 },
  hero: { flexDirection: 'row', alignItems: 'center', paddingTop: 72, paddingBottom: 80, gap: 56 },
  heroLeft: { flex: 1 },
  heroRight: { flex: 1, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 22,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: '#2B5BA8' },
  h1: { fontSize: 44, fontWeight: '800', lineHeight: 52, letterSpacing: -1.2, color: C.text, marginBottom: 18 },
  accent: { color: '#4A8FD4' },
  lead: { fontSize: 17, lineHeight: 28, color: C.textSoft, marginBottom: 34 },
  heroCta: { flexDirection: 'row', gap: 12 },
  ctaPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4A8FD4', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 9999 },
  ctaPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaOutline: { paddingHorizontal: 22, paddingVertical: 13, borderRadius: 9999, borderWidth: 1.5, borderColor: C.border },
  ctaOutlineText: { fontSize: 15, fontWeight: '600', color: C.text },
  heroImg: { width: '100%', maxWidth: 440, height: 340, borderRadius: 24 },
  divider: { height: 1, backgroundColor: C.border },
  smartinaSection: { paddingVertical: 72 },
  smartinaBanner: { borderRadius: 28, padding: 44, flexDirection: 'row', alignItems: 'center', gap: 44 },
  smartinaText: { flex: 1 },
  chipLight: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 14,
  },
  chipLightText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  smartinaTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.6, marginBottom: 12 },
  smartinaDesc: { fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 26, marginBottom: 24 },
  smartinaBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)', borderRadius: 9999,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  smartinaBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  featSection: { paddingVertical: 72 },
  sectionTitle: { fontSize: 30, fontWeight: '800', textAlign: 'center', letterSpacing: -0.6, color: C.text, marginBottom: 10 },
  sectionSub: { fontSize: 16, textAlign: 'center', lineHeight: 26, color: C.textSoft, marginBottom: 44 },
  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  featCard: { flex: 1, minWidth: 260, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 26 },
  featIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  featTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 6 },
  featDesc: { fontSize: 13, color: C.textSoft, lineHeight: 20 },
  ctaSection: { paddingBottom: 72 },
  ctaInner: { borderRadius: 28, padding: 60, alignItems: 'center' },
  ctaTitle: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.6, marginBottom: 12 },
  ctaSub: { fontSize: 16, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 32 },
  ctaWhiteBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 26, paddingVertical: 15, borderRadius: 9999 },
  ctaWhiteBtnText: { fontSize: 15, fontWeight: '700', color: '#2B5BA8' },
  footer: { paddingVertical: 28, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, alignItems: 'center' },
  footerText: { fontSize: 13, color: C.textMuted },
});

// ─── Stile video web ──────────────────────────────────────────────────────────
const webVideoStyleDesktop = {
  width: 200, height: 245, borderRadius: 18,
  objectFit: 'cover' as const, flexShrink: 0,
  border: '2.5px solid rgba(255,255,255,0.55)',
  boxShadow: '0 0 28px rgba(255,255,255,0.18)',
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function WelcomeScreen({ navigation }: Props) {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const { top } = useSafeAreaInsets();

  const smartinaPlayer = useVideoPlayer(
    require('../../../assets/smartina.mp4'),
    (p) => { p.loop = true; p.muted = true; p.play(); },
  );

  // ── Layout WEB ──────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    const W = makeWebStyles(C);
    return (
      <ScrollView style={W.page} showsVerticalScrollIndicator={false}>

        {/* Navbar */}
        <View style={W.navbar}>
          <View style={W.navInner}>
            <Image source={require('../../../assets/logo-itsocial.png')} style={W.navLogo} resizeMode="contain" />
            <View style={W.navActions}>
              <TouchableOpacity style={W.themeToggle} onPress={toggleTheme} activeOpacity={0.7}>
                <MaterialCommunityIcons name={isDark ? 'weather-sunny' : 'weather-night'} size={18} color={C.textSoft} />
              </TouchableOpacity>
              <TouchableOpacity style={W.loginBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={W.loginBtnText}>Accedi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={W.registerBtn} onPress={() => navigation.navigate('Register')}>
                <Text style={W.registerBtnText}>Registrati</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Hero — due colonne */}
        <View style={W.wrap}>
          <View style={W.hero}>
            <View style={W.heroLeft}>
              <View style={W.chip}>
                <MaterialCommunityIcons name="star-four-points" size={14} color="#2B5BA8" />
                <Text style={W.chipText}>Il social degli studenti ITS</Text>
              </View>
              <Text style={W.h1}>
                {'Connettiti con chi sta\n'}
                <Text style={W.accent}>seguendo il tuo percorso</Text>
              </Text>
              <Text style={W.lead}>
                ITSocial è la piattaforma pensata per gli studenti ITS di tutta Italia.
                Condividi, impara e trova opportunità di stage — tutto in un posto.
              </Text>
              <View style={W.heroCta}>
                <TouchableOpacity style={W.ctaPrimary} onPress={() => navigation.navigate('Register')}>
                  <MaterialCommunityIcons name="rocket-launch" size={16} color="#fff" />
                  <Text style={W.ctaPrimaryText}>Entra nella community</Text>
                </TouchableOpacity>
                <TouchableOpacity style={W.ctaOutline} onPress={() => navigation.navigate('Login')}>
                  <Text style={W.ctaOutlineText}>Ho già un account</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={W.heroRight}>
              <Image source={require('../../../assets/grafica.png')} style={W.heroImg} resizeMode="contain" />
            </View>
          </View>
        </View>

        <View style={W.divider} />

        {/* SmarTina */}
        <View style={[W.wrap, W.smartinaSection]}>
          <LinearGradient colors={['#2B5BA8', '#0f2545']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={W.smartinaBanner}>
            <WebVideo src={require('../../../assets/smartina.mp4')} autoPlay loop muted playsInline style={webVideoStyleDesktop} />
            <View style={W.smartinaText}>
              <View style={W.chipLight}>
                <MaterialCommunityIcons name="auto-fix" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={W.chipLightText}>Assistente AI</Text>
              </View>
              <Text style={W.smartinaTitle}>Ciao, sono SmarTina!</Text>
              <Text style={W.smartinaDesc}>
                La tua assistente digitale ITS. Chiedimi dei corsi, delle scadenze, come muoverti nel social.
              </Text>
              <TouchableOpacity style={W.smartinaBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={W.smartinaBtnText}>Provala subito →</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={W.divider} />

        {/* Features — 3 colonne */}
        <View style={[W.wrap, W.featSection]}>
          <Text style={W.sectionTitle}>Tutto quello che ti serve</Text>
          <Text style={W.sectionSub}>Funzionalità pensate per la vita dello studente ITS</Text>
          <View style={W.featGrid}>
            {FEATURES.map((f) => (
              <View key={f.title} style={W.featCard}>
                <View style={[W.featIcon, { backgroundColor: f.bg }]}>
                  <MaterialCommunityIcons name={f.icon} size={24} color={f.color} />
                </View>
                <Text style={W.featTitle}>{f.title}</Text>
                <Text style={W.featDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={[W.wrap, W.ctaSection]}>
          <LinearGradient colors={['#2B5BA8', '#0f2545']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={W.ctaInner}>
            <Text style={W.ctaTitle}>Entra a far parte della community</Text>
            <Text style={W.ctaSub}>Inizia oggi il tuo percorso di networking — è gratis.</Text>
            <TouchableOpacity style={W.ctaWhiteBtn} onPress={() => navigation.navigate('Register')}>
              <MaterialCommunityIcons name="account-plus" size={16} color="#2B5BA8" />
              <Text style={W.ctaWhiteBtnText}>Crea il tuo account</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={W.footer}>
          <Text style={W.footerText}>© 2025 ITSocial · Tutti i diritti riservati</Text>
        </View>

      </ScrollView>
    );
  }

  // ── Layout MOBILE (iOS / Android) ───────────────────────────────────────────
  const S = makeMobileStyles(C, top);
  return (
    <ScrollView style={S.page} showsVerticalScrollIndicator={false}>

      <View style={S.navBlock}>
        <View style={S.nav}>
          <Image source={require('../../../assets/logo-itsocial.png')} style={S.navLogo} resizeMode="contain" />
        </View>
        <View style={S.subNav}>
          <TouchableOpacity style={S.themeToggle} onPress={toggleTheme} activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
          >
            <MaterialCommunityIcons name={isDark ? 'weather-sunny' : 'weather-night'} size={20} color={C.textSoft} />
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

      <View style={S.smartinaWrap}>
        <LinearGradient colors={['#2B5BA8', '#0f2545']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.smartinaBanner}>
          <VideoView player={smartinaPlayer} style={S.smartinaImg} contentFit="cover" nativeControls={false} />
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

      <View style={S.ctaSection}>
        <LinearGradient colors={['#2B5BA8', '#0f2545']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.ctaInner}>
          <Text style={S.ctaTitle}>Entra a far parte della community</Text>
          <Text style={S.ctaSub}>Inizia oggi il tuo percorso di networking — è gratis.</Text>
          <TouchableOpacity style={S.ctaWhiteBtn} onPress={() => navigation.navigate('Register')}>
            <MaterialCommunityIcons name="account-plus" size={16} color="#2B5BA8" />
            <Text style={S.ctaWhiteBtnText}>Crea il tuo account</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={S.footer}>
        <Text style={S.footerText}>© 2025 ITSocial · Tutti i diritti riservati</Text>
      </View>

    </ScrollView>
  );
}
