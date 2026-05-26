import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  label: string;
  onAdd?: () => void;
  addLabel?: string;
};

export function AdminCountBar({ label, onAdd, addLabel = 'Aggiungi' }: Props) {
  const { colors: C } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: C.card, borderBottomColor: C.border }]}>
      <Text style={[styles.text, { color: C.textSoft }]}>{label}</Text>
      {onAdd && (
        <TouchableOpacity style={[styles.btn, { backgroundColor: C.primary }]} onPress={onAdd}>
          <MaterialCommunityIcons name="plus" size={14} color="#fff" />
          <Text style={styles.btnText}>{addLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 10,
  },
  text: { fontSize: 13, fontWeight: '600' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
