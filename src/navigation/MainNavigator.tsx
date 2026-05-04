import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, MainStackParamList } from '../types';
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import MessaggiScreen from '../screens/main/MessaggiScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import SavedPostsScreen from '../screens/main/SavedPostsScreen';
import { notificaService } from '../services/notificaService';
import { messaggiService } from '../services/messaggiService';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

// ─── Badge-aware tab icons ────────────────────────────────────────────────────
function NotificationIcon({ color }: { color: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () => notificaService.getContatore()
      .then(r => setCount(r.nonLette))
      .catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={iconStyles.wrap}>
      <Text style={[iconStyles.icon, { color }]}>🔔</Text>
      {count > 0 && (
        <View style={iconStyles.badge}>
          <Text style={iconStyles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

function MessagesIcon({ color }: { color: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () => messaggiService.getNonLettiTotale()
      .then(r => setCount(r.nonLetti))
      .catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={iconStyles.wrap}>
      <Text style={[iconStyles.icon, { color }]}>✉️</Text>
      {count > 0 && (
        <View style={iconStyles.badge}>
          <Text style={iconStyles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

function TabIcon({ label, color }: { label: string; color: string }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Search: '🔍',
    Profile: '👤',
  };
  return <Text style={[iconStyles.icon, { color }]}>{icons[label] ?? '•'}</Text>;
}

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4A8FD4',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 8,
        },
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700', color: '#1E293B', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Feed',
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color }) => <TabIcon label="Home" color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Cerca',
          tabBarLabel: 'Cerca',
          tabBarIcon: ({ color }) => <TabIcon label="Search" color={color} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifiche',
          tabBarLabel: 'Notifiche',
          tabBarIcon: ({ color }) => <NotificationIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessaggiScreen}
        options={{
          title: 'Messaggi',
          tabBarLabel: 'Messaggi',
          tabBarIcon: ({ color }) => <MessagesIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profilo',
          tabBarLabel: 'Profilo',
          tabBarIcon: ({ color }) => <TabIcon label="Profile" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Main Stack (wraps tabs + modal/full screens) ─────────────────────────────
export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserProfile"
        component={ProfileScreen}
        options={{ title: 'Profilo utente', headerBackTitle: 'Indietro' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Modifica profilo', headerBackTitle: 'Indietro' }}
      />
      <Stack.Screen
        name="Chat"
        component={MessaggiScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SavedPosts"
        component={SavedPostsScreen}
        options={{ title: 'Post salvati', headerBackTitle: 'Indietro' }}
      />
    </Stack.Navigator>
  );
}

const iconStyles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E53E3E',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
