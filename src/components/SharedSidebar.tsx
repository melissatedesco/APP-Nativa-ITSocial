import React, { useRef, useState } from 'react';
import { Animated, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { MainStackParamList } from '../types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const ICON_COLOR = '#4A8FD4';

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  sidebarTab: {
    position: 'absolute',
    right: 0,
    zIndex: 101,
    width: 22,
    height: 60,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#1E293B',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  sidebarPanel: {
    position: 'absolute',
    right: 24,
    zIndex: 100,
  },
  sidebarGlass: {
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    shadowColor: '#1E293B',
    shadowOffset: { width: -2, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
    gap: 4,
    alignItems: 'center',
  },
  sidebarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBtnActive: {
    backgroundColor: 'rgba(74,143,212,0.15)',
  },
  sidebarSep: {
    height: 1,
    width: 28,
    backgroundColor: 'rgba(74,143,212,0.20)',
    marginVertical: 4,
  },
});

export function SharedSidebar({ extraTopOffset = 0 }: { extraTopOffset?: number }) {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(C);
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  function toggleSidebar() {
    const next = !isOpen;
    setIsOpen(next);
    Animated.spring(slideAnim, {
      toValue: next ? 1 : 0,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }

  const topOffset = insets.top + extraTopOffset;

  const glassStyle = {
    backgroundColor: isDark ? 'rgba(13,27,46,0.84)' : 'rgba(255,255,255,0.84)',
    borderColor: isDark ? 'rgba(74,143,212,0.22)' : 'rgba(74,143,212,0.30)',
  };

  const panelTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [90, 0],
  });

  return (
    <>
      {/* Tab toggle – sempre visibile */}
      <TouchableOpacity
        style={[
          styles.sidebarTab,
          { top: topOffset + 8, backgroundColor: glassStyle.backgroundColor, borderColor: glassStyle.borderColor, borderRightWidth: 0 },
        ]}
        onPress={toggleSidebar}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-right' : 'chevron-left'}
          size={15}
          color={ICON_COLOR}
        />
      </TouchableOpacity>

      {/* Pannello a scomparsa */}
      <Animated.View
        style={[
          styles.sidebarPanel,
          { top: topOffset, transform: [{ translateX: panelTranslate }] },
        ]}
      >
        <View style={[styles.sidebarGlass, glassStyle]}>

          {/* SmarTina */}
          <TouchableOpacity
            style={[styles.sidebarBtn, styles.sidebarBtnActive]}
            onPress={() => navigation.navigate('SmartinaChat')}
            activeOpacity={0.75}
          >
            <Image
              source={require('../../assets/smartina.png')}
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.sidebarSep} />

          {/* Classe principale */}
          <TouchableOpacity
            style={styles.sidebarBtn}
            onPress={() => navigation.navigate('MyClass')}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="school-outline" size={22} color={ICON_COLOR} />
          </TouchableOpacity>

          {/* Messaggi */}
          <TouchableOpacity
            style={styles.sidebarBtn}
            onPress={() => navigation.navigate('Messages')}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="message-outline" size={22} color={ICON_COLOR} />
          </TouchableOpacity>

          <View style={styles.sidebarSep} />

          {/* Toggle tema */}
          <TouchableOpacity style={styles.sidebarBtn} onPress={toggleTheme} activeOpacity={0.75}>
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'weather-night'}
              size={22}
              color={ICON_COLOR}
            />
          </TouchableOpacity>

        </View>
      </Animated.View>
    </>
  );
}
