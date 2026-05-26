import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  style?: ViewStyle;
};

export function Field({ label, style, ...inputProps }: Props) {
  const { colors: C } = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.label, { color: C.textSoft }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.border, color: C.text }]}
        placeholderTextColor={C.textMuted}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  label: { fontSize: 12, fontWeight: '600' },
  input: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
  },
});
