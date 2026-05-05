import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainTabParamList, MainStackParamList } from '../types';
import HomeScreen from '../screens/main/HomeScreen';
import MyClassScreen from '../screens/main/MyClassScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import MessaggiScreen from '../screens/main/MessaggiScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import SavedPostsScreen from '../screens/main/SavedPostsScreen';
import { notificaService } from '../services/notificaService';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function BadgeIcon({ name, color, count }: { name: MCIName; color: string; count: number }) {
  return (
    <View style={iconStyles.wrap}>
      <MaterialCommunityIcons name={name} size={25} color={color} />
      {count > 0 && (
        <View style={iconStyles.badge}>
          <Text style={iconStyles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

function NotificationIcon({ color, focused }: { color: string; focused: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const load = () =>
      notificaService.getContatore().then(r => setCount(r.nonLette)).catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);
  return <BadgeIcon name={focused ? 'bell' : 'bell-outline'} color={color} count={count} />;
}

function MainTabs() {
  const { colors: C, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: isDark ? '#4a6580' : '#9ca3af',
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: true,
        headerStyle: { backgroundColor: C.card },
        headerTitleStyle: { fontWeight: '700', color: C.text, fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Feed',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} size={25} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyClass"
        component={MyClassScreen}
        options={{
          title: 'La mia Classe',
          tabBarLabel: 'Classe',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'account-group' : 'account-group-outline'} size={25} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifiche',
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
            <MaterialCommunityIcons name={focused ? 'account-circle' : 'account-circle-outline'} size={25} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

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
      <Stack.Screen name="SavedPosts" component={SavedPostsScreen} options={{ title: 'Post salvati' }} />
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
