import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NotifPrefsProvider } from './src/context/NotifPrefsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { initErrorReporting, captureException } from './src/utils/errorReporting';

initErrorReporting();

// On web, capture unhandled promise rejections.
// On native, @sentry/react-native hooks into the JS runtime automatically on init.
if (Platform.OS === 'web' && typeof globalThis !== 'undefined') {
  (globalThis as typeof globalThis & { addEventListener?: Function }).addEventListener?.(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      captureException(event.reason, { type: 'unhandledrejection' });
    },
  );
}

function ThemedApp() {
  const { isDark } = useTheme();

  const paperTheme = {
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDark ? MD3DarkTheme : MD3LightTheme).colors,
      primary: '#4A8FD4',
      secondary: '#3a7fc4',
      background: isDark ? '#0D1B2E' : '#F1F5F9',
      surface: isDark ? '#16222e' : '#ffffff',
      error: '#ef4444',
      onPrimary: '#ffffff',
      onSurface: isDark ? '#ffffff' : '#1E293B',
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <NotifPrefsProvider>
        <AuthProvider>
          <UserProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <AppNavigator />
          </UserProvider>
        </AuthProvider>
      </NotifPrefsProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
