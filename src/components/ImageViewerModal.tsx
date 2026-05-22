import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SW, height: SH } = Dimensions.get('window');
const SWIPE_CLOSE_THRESHOLD = 120;

interface Props {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export default function ImageViewerModal({ images, initialIndex = 0, visible, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList>(null);

  // Reset index when reopened
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      translateY.setValue(0);
      Animated.timing(bgOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      // scroll to initial index after layout
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 50);
    } else {
      bgOpacity.setValue(0);
    }
  }, [visible, initialIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Swipe-down to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > SWIPE_CLOSE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(translateY, { toValue: SH, duration: 200, useNativeDriver: true }),
            Animated.timing(bgOpacity,  { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(onClose);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 25 }).start();
        }
      },
    }),
  ).current;

  function handleClose() {
    Animated.parallel([
      Animated.timing(bgOpacity,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 60, duration: 180, useNativeDriver: true }),
    ]).start(onClose);
  }

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose} statusBarTranslucent>
      {Platform.OS === 'android' && <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />}
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>

        {/* Header */}
        <View style={styles.header}>
          {images.length > 1 && (
            <Text style={styles.counter}>{currentIndex + 1} / {images.length}</Text>
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialCommunityIcons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Images */}
        <Animated.View
          style={[styles.imageArea, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <FlatList
            ref={listRef}
            data={images}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
              setCurrentIndex(idx);
            }}
            renderItem={({ item }) => (
              <View style={styles.page}>
                <ExpoImage
                  source={{ uri: item }}
                  style={styles.image}
                  contentFit="contain"
                  transition={150}
                />
              </View>
            )}
          />
        </Animated.View>

        {/* Dot indicators */}
        {images.length > 1 && (
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
            ))}
          </View>
        )}

      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    zIndex: 10,
  },
  counter: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.9,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    padding: 6,
  },
  imageArea: {
    flex: 1,
  },
  page: {
    width: SW,
    height: SH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SW,
    height: SH * 0.85,
  },
  dots: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
});
