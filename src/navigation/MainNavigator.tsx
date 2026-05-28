import React, { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, Vibration, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainTabParamList, MainStackParamList } from '../types';
import DashboardScreen from '../screens/main/DashboardScreen';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import MessaggiScreen from '../screens/main/MessaggiScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import SavedPostsScreen from '../screens/main/SavedPostsScreen';
import MyClassScreen from '../screens/main/MyClassScreen';
import SmartinaChatScreen from '../screens/main/SmartinaChatScreen';
import AdminPanelScreen from '../screens/main/AdminPanelScreen';
import UserListScreen from '../screens/main/UserListScreen';
import PostListScreen from '../screens/main/PostListScreen';
import AdminUtentiScreen from '../screens/admin/AdminUtentiScreen';
import AdminRuoliScreen from '../screens/admin/AdminRuoliScreen';
import AdminPermessiScreen from '../screens/admin/AdminPermessiScreen';
import AdminIstitutiScreen from '../screens/admin/AdminIstitutiScreen';
import AdminClasseCorsoScreen from '../screens/admin/AdminClasseCorsoScreen';
import AdminRuoloDetailScreen from '../screens/admin/AdminRuoloDetailScreen';
import AdminDocentiScreen from '../screens/admin/AdminDocentiScreen';
import PostDetailScreen from '../screens/main/PostDetailScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import { notificaService } from '../services/notificaService';
import { messaggiService } from '../services/messaggiService';
import { useNotifPrefs } from '../context/NotifPrefsContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const POLL_INTERVAL = 10000;

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// ─── Shared polling hook ──────────────────────────────────────────────────────
function usePollingCount(fetchFn: () => Promise<number>, onIncrease: () => void): number {
  const [count, setCount] = useState(0);
  const prevRef = useRef(-1);
  const fetchRef = useRef(fetchFn);
  const onIncreaseRef = useRef(onIncrease);
  fetchRef.current = fetchFn;
  onIncreaseRef.current = onIncrease;

  useEffect(() => {
    const load = async () => {
      try {
        const n = await fetchRef.current();
        if (prevRef.current >= 0 && n > prevRef.current) {
          onIncreaseRef.current();
        }
        prevRef.current = n;
        setCount(n);
      } catch {}
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') load();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return count;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function BadgeIcon({ name, color, count }: { name: MCIName; color: string; count: number }) {
  return (
    <View style={iconStyles.wrap}>
      <MaterialCommunityIcons name={name} size={28} color={color} />
      {count > 0 && (
        <View style={iconStyles.badge}>
          <Text style={iconStyles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

function NotificationIcon({ color, focused }: { color: string; focused: boolean }) {
  const { prefs } = useNotifPrefs();
  const count = usePollingCount(
    () => notificaService.getContatore().then(r => r.nonLette),
    () => { if (prefs.vibraNotifiche) Vibration.vibrate(300); },
  );
  return <BadgeIcon name={focused ? 'bell' : 'bell-outline'} color={color} count={count} />;
}

function MessagesIcon({ color, focused }: { color: string; focused: boolean }) {
  const { prefs } = useNotifPrefs();
  const count = usePollingCount(
    () => messaggiService.getNonLettiTotale().then(r => r.nonLetti),
    () => { if (prefs.vibraMessaggi) Vibration.vibrate([0, 150, 80, 150]); },
  );
  return <BadgeIcon name={focused ? 'chat' : 'chat-outline'} color={color} count={count} />;
}

// ─── Tab navigator ────────────────────────────────────────────────────────────
function MainTabs() {
  const { colors: C, isDark } = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: isDark ? '#8aa5bf' : '#6b7280',
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 64 + bottom,
          paddingBottom: bottom + 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIconStyle: { marginBottom: 2 },
        headerShown: true,
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontWeight: '700', color: C.text, fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Bacheca',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messaggi"
        component={MessaggiScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Messaggi',
          tabBarIcon: ({ color, focused }) => (
            <MessagesIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Notifiche',
          tabBarIcon: ({ color, focused }) => (
            <NotificationIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profilo',
          tabBarLabel: 'Profilo',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account-circle' : 'account-circle-outline'}
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Stack navigator ──────────────────────────────────────────────────────────
export default function MainNavigator() {
  const { colors: C } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { color: C.text },
        headerTintColor: C.primary,
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="UserProfile" component={ProfileScreen} options={{ title: 'Profilo utente' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Modifica profilo' }} />
      <Stack.Screen name="Messages" component={MessaggiScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={MessaggiScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SavedPosts" component={SavedPostsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="MyClass"
        component={MyClassScreen}
        options={{
          headerBackTitle: 'Back',
          headerTintColor: '#4A8FD4',
          headerTitle: () => (
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a2535', paddingVertical: 16 }}>
              Le mie Classi
            </Text>
          ),
          headerRight: () => (
            <MaterialCommunityIcons name="google-classroom" size={26} color="#4A8FD4" />
          ),
        }}
      />
      <Stack.Screen
        name="SmartinaChat"
        component={SmartinaChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ title: 'Pannello Admin' }} />
      <Stack.Screen name="UserList" component={UserListScreen} options={({ route }) => ({ title: (route.params as any).title })} />
      <Stack.Screen name="PostList" component={PostListScreen} options={({ route }) => ({ title: (route.params as any).title })} />
      <Stack.Screen name="AdminUtenti" component={AdminUtentiScreen} options={{ title: 'Gestisci Utenti' }} />
      <Stack.Screen name="AdminRuoli" component={AdminRuoliScreen} options={{ title: 'Gestisci Ruoli' }} />
      <Stack.Screen name="AdminPermessi" component={AdminPermessiScreen} options={{ title: 'Gestisci Permessi' }} />
      <Stack.Screen name="AdminIstituti" component={AdminIstitutiScreen} options={{ title: 'Gestisci Istituti' }} />
      <Stack.Screen name="AdminClasseCorso" component={AdminClasseCorsoScreen} options={{ title: 'Gestisci Classi Corso' }} />
      <Stack.Screen
        name="AdminRuoloDetail"
        component={AdminRuoloDetailScreen}
        options={({ route }) => ({ title: `Permessi — ${(route.params as any).ruoloNome}` })}
      />
      <Stack.Screen name="AdminDocenti" component={AdminDocentiScreen} options={{ title: 'Gestisci Docenti' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Impostazioni' }} />
    </Stack.Navigator>
  );
}

const iconStyles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
