import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type NavItem = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  active?: boolean;
  onPress: () => void;
};

const makeStyles = (C: ThemeColors, collapsed: boolean) => StyleSheet.create({
  sidebar: {
    width: collapsed ? 72 : 240,
    backgroundColor: C.card,
    borderRightWidth: 1,
    borderRightColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: collapsed ? 8 : 12,
    gap: 2,
    alignItems: collapsed ? 'center' : undefined,
  } as any,
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: collapsed ? 0 : 12,
    paddingVertical: 14,
    marginBottom: 8,
    justifyContent: collapsed ? 'center' : undefined,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -0.5,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: collapsed ? 0 : 12,
    paddingVertical: 12,
    borderRadius: 12,
    width: collapsed ? 48 : undefined,
    justifyContent: collapsed ? 'center' : undefined,
  } as any,
  navItemActive: {
    backgroundColor: C.saveBg,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  navLabelActive: {
    fontWeight: '700',
    color: C.primary,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 6,
    width: collapsed ? 32 : undefined,
    alignSelf: collapsed ? 'center' : undefined,
  } as any,
  spacer: { flex: 1 },
});

export function WebNavSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(C, collapsed);
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const mainItems: NavItem[] = [
    {
      icon: 'home',
      label: 'Bacheca',
      active: true,
      onPress: () => {},
    },
    {
      icon: 'message-outline',
      label: 'Messaggi',
      onPress: () => navigation.navigate('Messages'),
    },
    {
      icon: 'school-outline',
      label: 'La mia classe',
      onPress: () => navigation.navigate('MyClass'),
    },
    {
      icon: 'star-four-points-outline',
      label: 'SmarTina AI',
      onPress: () => navigation.navigate('SmartinaChat'),
    },
    {
      icon: 'account-outline',
      label: 'Profilo',
      onPress: () => {
        const username = (user as any)?.username;
        if (username) navigation.navigate('UserProfile', { username });
      },
    },
  ];

  const bottomItems: NavItem[] = [
    {
      icon: 'cog-outline',
      label: 'Impostazioni',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      icon: isDark ? 'weather-sunny' : 'weather-night',
      label: isDark ? 'Tema chiaro' : 'Tema scuro',
      onPress: toggleTheme,
    },
  ];

  function NavBtn({ item }: { item: NavItem }) {
    return (
      <TouchableOpacity
        style={[styles.navItem, item.active && styles.navItemActive]}
        onPress={item.onPress}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={22}
          color={item.active ? C.primary : C.textSoft}
        />
        {!collapsed && (
          <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>
            {item.label}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <MaterialCommunityIcons name="school" size={20} color="#fff" />
        </View>
        {!collapsed && <Text style={styles.logoText}>ITSocial</Text>}
      </View>

      {mainItems.map(item => <NavBtn key={item.label} item={item} />)}

      <View style={styles.spacer} />
      <View style={styles.divider} />

      {bottomItems.map(item => <NavBtn key={item.label} item={item} />)}
    </View>
  );
}
