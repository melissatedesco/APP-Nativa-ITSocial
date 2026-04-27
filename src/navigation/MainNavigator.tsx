import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { MainTabParamList, MainStackParamList } from '../types';
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function TabIcon({ label }: { label: string }) {
  const icons: Record<string, string> = { Home: '🏠', Search: '🔍', Profile: '👤' };
  return <Text style={{ fontSize: 20 }}>{icons[label] ?? '•'}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <TabIcon label={route.name} />,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Feed' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Cerca' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilo' }} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="UserProfile" component={ProfileScreen} options={{ title: 'Profilo utente' }} />
    </Stack.Navigator>
  );
}
