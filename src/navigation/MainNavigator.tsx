import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MainTabParamList } from '../types';
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label }: { label: string }) {
  const icons: Record<string, string> = { Home: '🏠', Search: '🔍', Profile: '👤' };
  return <Text style={{ fontSize: 20 }}>{icons[label] ?? '•'}</Text>;
}

export default function MainNavigator() {
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
