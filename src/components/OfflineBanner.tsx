import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { networkEvents } from '../utils/networkEvents';

type BannerStatus = 'offline' | 'reconnected';

export function OfflineBanner() {
  const [status, setStatus] = useState<BannerStatus | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { top } = useSafeAreaInsets();

  function slideIn() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  function slideOut(delay: number) {
    hideTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setStatus(null));
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
        styles.toast,
        { top: top + 12 },
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={[styles.inner, { backgroundColor: isOffline ? '#dc2626' : '#16a34a' }]}>
        <MaterialCommunityIcons
          name={isOffline ? 'wifi-off' : 'wifi-check'}
          size={18}
          color="#fff"
        />
        <Text style={styles.text}>
          {isOffline ? 'Nessuna connessione' : 'Connessione ripristinata'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 9999,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
