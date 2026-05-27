import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { captureException } from '../utils/errorReporting';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  componentStack: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '', componentStack: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message, componentStack: '' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Errore non gestito:', error.message);
      console.error('[ErrorBoundary] Stack componenti:', info.componentStack);
    }
    captureException(error, { componentStack: info.componentStack ?? '' });
    this.setState({ componentStack: info.componentStack ?? '' });
  }

  reset = () => {
    this.setState({ hasError: false, errorMessage: '', componentStack: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.title}>Qualcosa è andato storto</Text>
        <Text style={styles.subtitle}>
          Si è verificato un errore imprevisto. Premi "Riprova" oppure riavvia l'app.
        </Text>

        {__DEV__ && this.state.errorMessage ? (
          <ScrollView style={styles.detailBox} contentContainerStyle={{ padding: 12 }}>
            <Text style={styles.detailText}>{this.state.errorMessage}</Text>
            {this.state.componentStack ? (
              <Text style={[styles.detailText, { marginTop: 8, opacity: 0.7 }]}>
                {this.state.componentStack}
              </Text>
            ) : null}
          </ScrollView>
        ) : null}

        <TouchableOpacity style={styles.btn} onPress={this.reset} activeOpacity={0.8}>
          <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
          <Text style={styles.btnText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a2535',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#617585',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  detailBox: {
    width: '100%',
    maxHeight: 160,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginTop: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#7f1d1d',
    fontFamily: 'monospace',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4A8FD4',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
