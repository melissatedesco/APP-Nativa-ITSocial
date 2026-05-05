import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function ThemedApp() {
  const { isDark } = useTheme();

  const paperTheme = {
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDark ? MD3DarkTheme : MD3LightTheme).colors,
      primary: '#00bcd4',
      secondary: '#0097a7',
      background: isDark ? '#0b141e' : '#F8FAFC',
      surface: isDark ? '#16222e' : '#ffffff',
      error: '#ef4444',
      onPrimary: '#ffffff',
      onSurface: isDark ? '#ffffff' : '#1A2433',
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <UserProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AppNavigator />
        </UserProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

export default function App() {
  console.log('[App] componente montato');
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
