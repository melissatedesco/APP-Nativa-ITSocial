import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  style?: ViewStyle;
  error?: string;
};

export function Field({ label, style, error, ...inputProps }: Props) {
  const { colors: C } = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.label, { color: error ? C.danger : C.textSoft }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: C.inputBg, borderColor: error ? C.danger : C.border, color: C.text },
        ]}
        placeholderTextColor={C.textMuted}
        {...inputProps}
      />
      {!!error && <Text style={[styles.errorText, { color: C.danger }]}>{error}</Text>}
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
  errorText: { fontSize: 11, fontWeight: '500' },
});
