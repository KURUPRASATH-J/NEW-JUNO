import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';

export default function ShareMenu({ visible, onClose, messages = [] }) {
  const { colors: theme } = useTheme();

  const formatMessages = () => {
    return messages.map(m => {
      const role = m.type === 'user' ? 'You' : 'Juno AI';
      return `${role}: ${m.text}`;
    }).join('\n\n');
  };

  const handleCopy = async () => {
    const text = formatMessages();
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Conversation copied to clipboard');
    onClose();
  };

  const handleShare = async () => {
    try {
      const text = formatMessages();
      await Share.share({
        message: text,
        title: 'Juno AI Conversation',
      });
      onClose();
    } catch (e) {
      console.log('Share failed:', e);
    }
  };

  const handleExport = async () => {
    const text = `# Juno AI Conversation\n# Exported: ${new Date().toLocaleString()}\n\n${formatMessages()}`;
    try {
      await Share.share({
        message: text,
        title: 'Juno AI Conversation Export',
      });
      onClose();
    } catch (e) {
      console.log('Export failed:', e);
    }
  };

  const options = [
    { icon: 'copy', label: 'Copy to Clipboard', subtitle: 'Copy all messages as text', onPress: handleCopy, color: '#6C63FF' },
    { icon: 'share-alt', label: 'Share', subtitle: 'Share via apps', onPress: handleShare, color: '#00D4AA' },
    { icon: 'file-alt', label: 'Export as Text', subtitle: 'Format and share as document', onPress: handleExport, color: '#F59E0B' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.title, { color: theme.text }]}>Share Conversation</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {messages.length} messages
          </Text>

          <View style={styles.options}>
            {options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.optionRow, { borderColor: theme.border }]}
                onPress={opt.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: opt.color + '15' }]}>
                  <FontAwesome5 name={opt.icon} size={16} color={opt.color} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: theme.text }]}>{opt.label}</Text>
                  <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>{opt.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20,
    paddingBottom: 34, paddingTop: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 20 },
  options: { gap: 8, marginBottom: 16 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 1, gap: 12,
  },
  optionIcon: {
    width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  optionContent: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  optionSubtitle: { fontSize: 12 },
  cancelBtn: {
    alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
