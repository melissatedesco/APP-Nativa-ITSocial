import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { UserProvider } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </UserProvider>
    </AuthProvider>
  );
}
