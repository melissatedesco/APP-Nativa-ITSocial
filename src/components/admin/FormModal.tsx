import React, { ReactNode } from 'react';
import {
  Modal, KeyboardAvoidingView, ScrollView, TouchableOpacity,
  Text, ActivityIndicator, Platform, StyleSheet,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onSubmit: () => void;
  saving: boolean;
  submitLabel: string;
  children: ReactNode;
};

export function FormModal({ visible, onClose, title, subtitle, onSubmit, saving, submitLabel, children }: Props) {
  const { colors: C } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.sheet, { backgroundColor: C.card }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: C.text }]}>{title}</Text>
          {!!subtitle && <Text style={[styles.sub, { color: C.textSoft }]}>{subtitle}</Text>}
          {children}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: C.primary }]}
            onPress={onSubmit}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>{submitLabel}</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelText, { color: C.textSoft }]}>Annulla</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, gap: 12,
  },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  sub: { fontSize: 13, marginBottom: 4 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 14 },
});
