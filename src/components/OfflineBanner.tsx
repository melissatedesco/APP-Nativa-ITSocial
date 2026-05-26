import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { networkEvents } from '../utils/networkEvents';

type BannerStatus = 'offline' | 'reconnected';

export function OfflineBanner() {
  const [status, setStatus] = useState<BannerStatus | null>(null);
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { top } = useSafeAreaInsets();

  function slideIn() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }

  function slideOut(delay: number) {
    hideTimer.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }, delay);
  }

  useEffect(() => {
    networkEvents.setOnOffline(() => {
      setStatus('offline');
      slideIn();
    });

    networkEvents.setOnOnline(() => {
      setStatus('reconnected');
      slideIn();
      slideOut(2500);
    });

    return () => {
      networkEvents.clear();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (status === null) return null;

  const isOffline = status === 'offline';

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: isOffline ? '#dc2626' : '#16a34a', paddingTop: top + 6 },
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.text}>
        {isOffline ? '⚠ Nessuna connessione — dati dalla cache' : '✓ Connessione ripristinata'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 8,
    alignItems: 'center',
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.2 },
});
