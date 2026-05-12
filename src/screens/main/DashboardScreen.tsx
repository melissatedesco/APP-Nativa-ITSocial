import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/UserContext';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { classeService } from '../../services/classeService';
import { notificaService } from '../../services/notificaService';
import { IscrizioneClasseDto, MainStackParamList, MainTabParamList } from '../../types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<MainStackParamList>
>;

// ── Countdown helpers ──────────────────────────────────────────────────────────

const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

function getNextSchoolDay(): Date {
  const target = new Date();
  target.setHours(8, 0, 0, 0);
  if (target <= new Date()) target.setDate(target.getDate() + 1);
  while (target.getDay() === 0 || target.getDay() === 6) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  // ─ Top Bar
  topBarWrap: {
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  topBarCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  brandLogo: { width: 26, height: 26 },
  brandText: { fontSize: 17, fontWeight: '800', color: C.brand, letterSpacing: -0.3 },
  topAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topAvatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  bellWrap: { position: 'relative', padding: 4 },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // ─ Scroll
  scrollContent: { paddingBottom: 40 },

  // ─ Section header
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  sectionLink: { fontSize: 13, fontWeight: '600', color: C.primary },

  // ─ Hero card
  heroCard: {
    borderRadius: 28,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginHorizontal: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  heroLeft: { flex: 1, gap: 4 },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroClassName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  heroProfessore: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  heroDate: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  heroRight: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginLeft: 16,
  },
  heroCountdown: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  heroCountdownLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },

  heroEmpty: {
    borderRadius: 28,
    padding: 24,
    marginTop: 22,
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  heroEmptyText: { fontSize: 14, fontWeight: '700', color: C.textSoft },
  heroEmptySubtext: { fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18 },

  // ─ Classi horizontal
  classiList: { paddingLeft: 16, paddingRight: 8 },
  classeCard: {
    width: 150,
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginRight: 10,
    gap: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  classeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classeName: { fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 18 },
  classeProfessore: { fontSize: 11, color: C.textSoft, marginTop: 2 },
  classiEmpty: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
    paddingHorizontal: 16,
  },
  classiEmptyText: { fontSize: 13, color: C.textMuted },

  // ─ Smartina banner
  smartinaCard: {
    borderRadius: 28,
    marginHorizontal: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  smartinaAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartinaBody: { flex: 1 },
  smartinaTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  smartinaSub: { fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2 },

  // ─ Bottom grid
  grid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 28,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  gridCardLabel: { fontSize: 14, fontWeight: '800', color: '#fff', marginTop: 6 },

  // ─ Right sidebar glassmorphism
  sidebar: {
    position: 'absolute',
    right: 12,
    zIndex: 100,
  },
  sidebarGlass: {
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    shadowColor: '#1E293B',
    shadowOffset: { width: -2, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
    gap: 4,
    alignItems: 'center',
  },
  sidebarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBtnActive: {
    backgroundColor: 'rgba(74,143,212,0.15)',
  },
  sidebarSep: {
    height: 1,
    width: 28,
    backgroundColor: 'rgba(74,143,212,0.20)',
    marginVertical: 4,
  },
});

// ── SidebarDashboard ──────────────────────────────────────────────────────────

const CLASS_ICONS: React.ComponentProps<typeof MaterialCommunityIcons>['name'][] = [
  'school-outline',
  'book-open-outline',
  'clipboard-text-outline',
  'flask-outline',
];

function SidebarDashboard({
  classes,
  topOffset,
  onSmarTina,
  onClassPress,
  onMessages,
  onMyClass,
}: {
  classes: IscrizioneClasseDto[];
  topOffset: number;
  onSmarTina: () => void;
  onClassPress: (classeId: number) => void;
  onMessages: () => void;
  onMyClass: () => void;
}) {
  const { colors: C, isDark } = useTheme();
  const styles = makeStyles(C);

  const glassStyle = {
    backgroundColor: isDark ? 'rgba(13,27,46,0.84)' : 'rgba(255,255,255,0.84)',
    borderColor: isDark ? 'rgba(74,143,212,0.22)' : 'rgba(74,143,212,0.30)',
  };
  const iconColor = '#4A8FD4';

  return (
    <View style={[styles.sidebar, { top: topOffset }]}>
      <View style={[styles.sidebarGlass, glassStyle]}>

        {/* SmarTina – azione primaria */}
        <TouchableOpacity
          style={[styles.sidebarBtn, styles.sidebarBtnActive]}
          onPress={onSmarTina}
          activeOpacity={0.75}
        >
          <Image source={require('../../../assets/smartina.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
        </TouchableOpacity>

        <View style={styles.sidebarSep} />

        {/* Icone classi */}
        {classes.length === 0 ? (
          <TouchableOpacity
            style={[styles.sidebarBtn, { opacity: 0.35 }]}
            onPress={onMyClass}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="school-outline" size={22} color={iconColor} />
          </TouchableOpacity>
        ) : (
          classes.slice(0, 4).map((cls, i) => (
            <TouchableOpacity
              key={cls.id}
              style={styles.sidebarBtn}
              onPress={() => onClassPress(cls.id)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={CLASS_ICONS[i % CLASS_ICONS.length]}
                size={22}
                color={iconColor}
              />
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sidebarSep} />

        {/* Tutte le classi */}
        <TouchableOpacity style={styles.sidebarBtn} onPress={onMyClass} activeOpacity={0.75}>
          <MaterialCommunityIcons name="view-grid-outline" size={22} color={iconColor} />
        </TouchableOpacity>

        {/* Messaggi */}
        <TouchableOpacity style={styles.sidebarBtn} onPress={onMessages} activeOpacity={0.75}>
          <MaterialCommunityIcons name="message-outline" size={22} color={iconColor} />
        </TouchableOpacity>

      </View>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ClasseCardItem({
  item,
  gradient,
}: {
  item: IscrizioneClasseDto;
  gradient: [string, string];
}) {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  return (
    <View style={styles.classeCard}>
      <LinearGradient colors={gradient} style={styles.classeIcon}>
        <MaterialCommunityIcons name="account-group" size={22} color="#fff" />
      </LinearGradient>
      <View>
        <Text style={styles.classeName} numberOfLines={2}>{item.classeNome}</Text>
        {item.professoreNome ? (
          <Text style={styles.classeProfessore} numberOfLines={1}>{item.professoreNome}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile } = useProfile();

  const [classi, setClassi] = useState<IscrizioneClasseDto[]>([]);
  const [bellCount, setBellCount] = useState(0);
  const [countdown, setCountdown] = useState('--:--:--');
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const HERO_GRADIENT: [string, string, string] = [C.primaryDark, C.primary, '#5BA3E0'];
  const CLASS_GRADIENT: [string, string] = [C.primary, C.primaryDark];

  useFocusEffect(
    useCallback(() => {
      classeService.miIscrizioni()
        .then(data => setClassi(data.filter(i => i.stato === 'APPROVATA')))
        .catch(() => {});
      notificaService.getContatore()
        .then(r => setBellCount(r.nonLette))
        .catch(() => {});
    }, [])
  );

  useEffect(() => {
    function tick() {
      setCountdown(formatCountdown(getNextSchoolDay().getTime() - Date.now()));
    }
    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const nextDay = getNextSchoolDay();
  const nextDayLabel = `${DAYS_IT[nextDay.getDay()]} ${nextDay.getDate()}/${nextDay.getMonth() + 1}`;
  const nextClasse = classi[0] ?? null;

  const userInitials = [user?.nome, user?.cognome]
    .map(s => (s ?? '')[0] ?? '')
    .join('')
    .toUpperCase() || '?';

  return (
    <View style={styles.page}>
      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <View style={[styles.topBarWrap, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topBar}>
          {/* Avatar → Profile */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <LinearGradient colors={CLASS_GRADIENT} style={styles.topAvatar}>
              <Text style={styles.topAvatarText}>{userInitials}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Brand centrata */}
          <View style={styles.topBarCenter} pointerEvents="none">
            <Image
              source={require('../../../assets/logo-itsocial.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>ITSocial</Text>
          </View>

          {/* Campanella → Notifications */}
          <TouchableOpacity
            style={styles.bellWrap}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={bellCount > 0 ? 'bell' : 'bell-outline'}
              size={24}
              color={bellCount > 0 ? C.primary : C.textSoft}
            />
            {bellCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{bellCount > 99 ? '99+' : bellCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero: Prossima Lezione ─────────────────────────────────────── */}
        {nextClasse ? (
          <LinearGradient
            colors={HERO_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>Prossima Lezione</Text>
              <Text style={styles.heroClassName} numberOfLines={2}>{nextClasse.classeNome}</Text>
              {nextClasse.professoreNome ? (
                <Text style={styles.heroProfessore}>{nextClasse.professoreNome}</Text>
              ) : null}
              <Text style={styles.heroDate}>{nextDayLabel} · 08:00</Text>
            </View>
            <View style={styles.heroRight}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="rgba(255,255,255,0.75)" />
              <Text style={styles.heroCountdown}>{countdown}</Text>
              <Text style={styles.heroCountdownLabel}>alla lezione</Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.heroEmpty}>
            <MaterialCommunityIcons name="school-outline" size={38} color={C.textMuted} />
            <Text style={styles.heroEmptyText}>Nessuna lezione in programma</Text>
            <Text style={styles.heroEmptySubtext}>
              Iscriviti a una classe per vedere il prossimo orario
            </Text>
          </View>
        )}

        {/* ── Le mie Classi ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Le mie Classi</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyClass')}>
              <Text style={styles.sectionLink}>Vedi tutte</Text>
            </TouchableOpacity>
          </View>
        </View>

        {classi.length === 0 ? (
          <View style={styles.classiEmpty}>
            <MaterialCommunityIcons name="account-group-outline" size={36} color={C.textMuted} />
            <Text style={styles.classiEmptyText}>Nessuna classe ancora</Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={classi}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.classiList}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <ClasseCardItem item={item} gradient={CLASS_GRADIENT} />
            )}
          />
        )}

        {/* ── Smartina Box ──────────────────────────────────────────────── */}
        <View style={[styles.section, { paddingHorizontal: 0 }]}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('SmartinaChat')}
          >
            <LinearGradient
              colors={['#2B5BA8', '#1a3768']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.smartinaCard}
            >
              <View style={styles.smartinaAvatar}>
                <Image source={require('../../../assets/smartina.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
              </View>
              <View style={styles.smartinaBody}>
                <Text style={styles.smartinaTitle}>Smartina</Text>
                <Text style={styles.smartinaSub}>Chiedimi qualcosa, sono qui per aiutarti</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.65)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Bottom Grid: Messaggi + Salvati ───────────────────────────── */}
        <View style={[styles.grid, { marginTop: 22 }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('Messages')}
          >
            <LinearGradient
              colors={['#4A8FD4', '#2D6BB5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridCard}
            >
              <MaterialCommunityIcons
                name="message-text-outline"
                size={30}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.gridCardLabel}>Messaggi</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('SavedPosts')}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridCard}
            >
              <MaterialCommunityIcons
                name="bookmark-outline"
                size={30}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.gridCardLabel}>Salvati</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
      <SidebarDashboard
        classes={classi}
        topOffset={insets.top + 68}
        onSmarTina={() => navigation.navigate('SmartinaChat')}
        onClassPress={() => navigation.navigate('MyClass')}
        onMessages={() => navigation.navigate('Messages')}
        onMyClass={() => navigation.navigate('MyClass')}
      />
    </View>
  );
}
