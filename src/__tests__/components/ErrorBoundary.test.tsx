import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Componente che crasha su richiesta per simulare errori runtime
function Bomba({ scoppia }: { scoppia: boolean }) {
  if (scoppia) throw new Error('Crash di test');
  return <Text>App funzionante</Text>;
}

// Versione con ref per testare il ripristino senza race condition:
// impostiamo crashRef.current = false PRIMA di premere Riprova,
// così al re-render il componente non ri-crasha.
const crashRef = { current: true };
function BombaControllata() {
  if (crashRef.current) throw new Error('Crash di test');
  return <Text>App funzionante</Text>;
}

describe('ErrorBoundary', () => {
  // React logga gli errori non gestiti in console.error — lo silenziamo nei test
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renderizza i figli normalmente quando non ci sono errori', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Bomba scoppia={false} />
      </ErrorBoundary>
    );

    expect(getByText('App funzionante')).toBeTruthy();
  });

  it('mostra UI di fallback quando un componente figlio crasha', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Bomba scoppia={true} />
      </ErrorBoundary>
    );

    expect(getByText('Qualcosa è andato storto')).toBeTruthy();
    expect(getByText('Riprova')).toBeTruthy();
  });

  it('non mostra i figli quando è in stato di errore', () => {
    const { queryByText } = render(
      <ErrorBoundary>
        <Bomba scoppia={true} />
      </ErrorBoundary>
    );

    expect(queryByText('App funzionante')).toBeNull();
  });

  it('mostra i dettagli dell\'errore in modalità __DEV__', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Bomba scoppia={true} />
      </ErrorBoundary>
    );

    // In test environment __DEV__ is true, so the error message should be visible
    expect(getByText(/Crash di test/)).toBeTruthy();
  });

  it('ripristina lo stato e mostra i figli al clic su Riprova', () => {
    crashRef.current = true;

    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <BombaControllata />
      </ErrorBoundary>
    );

    expect(getByText('Qualcosa è andato storto')).toBeTruthy();

    // Disabilita il crash PRIMA di premere Riprova: quando l'ErrorBoundary
    // ri-renderizza i figli dopo il reset, BombaControllata non crasha più.
    crashRef.current = false;
    fireEvent.press(getByText('Riprova'));

    expect(getByText('App funzionante')).toBeTruthy();
    expect(queryByText('Qualcosa è andato storto')).toBeNull();
  });

  it('logga l\'errore in console.error in modalità __DEV__', () => {
    render(
      <ErrorBoundary>
        <Bomba scoppia={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });
});
