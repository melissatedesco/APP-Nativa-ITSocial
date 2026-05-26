import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
};

export function AdminEmptyState({ icon, text }: Props) {
  const { colors: C } = useTheme();
  return (
    <View style={styles.center}>
      <MaterialCommunityIcons name={icon} size={48} color={C.textMuted} />
      <Text style={[styles.text, { color: C.textSoft }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 60 },
  text: { fontSize: 14 },
});
