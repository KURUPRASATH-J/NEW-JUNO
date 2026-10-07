import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function MemoryModal({ visible, onClose }) {
  const { colors: theme } = useTheme();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      api.getMemory(token)
        .then(res => setData(res))
        .catch(e => console.log('Failed to fetch memory:', e))
        .finally(() => setLoading(false));
    }
  }, [visible, token]);

  const InfoRow = ({ icon, label, value, color }) => (
    <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: (color || theme.primary) + '15' }]}>
        <FontAwesome5 name={icon} size={14} color={color || theme.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
          {value || 'N/A'}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>🧠 Memory & Session</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.card }]}>
              <FontAwesome5 name="times" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading memory data...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <InfoRow
                icon="fingerprint"
                label="Session ID"
                value={data?.session_id?.slice(0, 12) + '...'}
                color="#6C63FF"
              />
              <InfoRow
                icon="user"
                label="User Name"
                value={data?.user_name || 'Not set'}
                color="#00D4AA"
              />
              <InfoRow
                icon="comments"
                label="Chat History"
                value={`${data?.chat_history_length || 0} messages`}
                color="#F59E0B"
              />
              <InfoRow
                icon="database"
                label="Vector Store"
                value={data?.has_vectorstore ? '🟢 Active' : '⚪ Inactive'}
                color="#8B5CF6"
              />

              {/* Raw Memory */}
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RAW MEMORY</Text>
              <View style={[styles.rawMemory, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ScrollView horizontal={false} showsVerticalScrollIndicator nestedScrollEnabled>
                  <Text style={[styles.rawText, { color: theme.textSecondary }]}>
                    {data?.memory ? JSON.stringify(data.memory, null, 2) : 'No memory data available'}
                  </Text>
                </ScrollView>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  card: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20,
    maxHeight: '70%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15, shadowRadius: 15, elevation: 10,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14 },
  content: { paddingBottom: 20 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 0.5, gap: 12,
  },
  infoIcon: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '500' },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 8,
  },
  rawMemory: {
    padding: 12, borderRadius: 10, borderWidth: 1, maxHeight: 150,
  },
  rawText: { fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
});
