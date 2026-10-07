import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function VoiceModal({ visible, onClose, onResult }) {
  const { colors: theme } = useTheme();
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      const createPulse = (val, delay) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, { toValue: 1.5, duration: 1200, useNativeDriver: true }),
            Animated.timing(val, { toValue: 1, duration: 1200, useNativeDriver: true }),
          ])
        );
      const a1 = createPulse(pulse1, 0);
      const a2 = createPulse(pulse2, 400);
      const a3 = createPulse(pulse3, 800);
      a1.start(); a2.start(); a3.start();
      return () => { a1.stop(); a2.stop(); a3.stop(); };
    }
  }, [visible]);

  const handleStop = () => {
    // Voice recognition placeholder — requires native module on device
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.content, { backgroundColor: theme.surface }]}>
          {/* Animated Circles */}
          <View style={styles.circlesContainer}>
            <Animated.View style={[styles.circle, styles.circle3, {
              borderColor: theme.primary + '20',
              transform: [{ scale: pulse3 }],
            }]} />
            <Animated.View style={[styles.circle, styles.circle2, {
              borderColor: theme.primary + '40',
              transform: [{ scale: pulse2 }],
            }]} />
            <Animated.View style={[styles.circle, styles.circle1, {
              borderColor: theme.primary + '60',
              transform: [{ scale: pulse1 }],
            }]} />
            <View style={[styles.micCircle, { backgroundColor: theme.primary }]}>
              <FontAwesome5 name="microphone" size={28} color="#FFF" />
            </View>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>Listening...</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Speak clearly into your microphone
          </Text>

          <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <FontAwesome5 name="info-circle" size={14} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Voice input works on physical devices with the expo-speech module installed.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.stopBtn, { backgroundColor: theme.error }]}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="stop" size={16} color="#FFF" />
            <Text style={styles.stopText}>Stop Recording</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  content: {
    width: '100%', borderRadius: 24, padding: 30, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  circlesContainer: {
    width: 160, height: 160, justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  circle: {
    position: 'absolute', borderWidth: 2, borderRadius: 999,
  },
  circle1: { width: 100, height: 100 },
  circle2: { width: 130, height: 130 },
  circle3: { width: 160, height: 160 },
  micCircle: {
    width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10,
    borderWidth: 1, gap: 8, marginBottom: 24, width: '100%',
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 16 },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24,
    paddingVertical: 14, borderRadius: 25, gap: 8, marginBottom: 12,
  },
  stopText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  cancelBtn: { paddingVertical: 8 },
  cancelText: { fontSize: 14 },
});
