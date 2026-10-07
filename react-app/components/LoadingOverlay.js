import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function LoadingOverlay({ visible, text = 'Processing...' }) {
  const { colors: theme } = useTheme();
  const spin1 = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  const spin3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const createSpin = (val, duration, reverse = false) =>
        Animated.loop(
          Animated.timing(val, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );

      const a1 = createSpin(spin1, 2000);
      const a2 = createSpin(spin2, 3000);
      const a3 = createSpin(spin3, 4000);
      a1.start(); a2.start(); a3.start();

      return () => { a1.stop(); a2.stop(); a3.stop(); };
    } else {
      spin1.setValue(0);
      spin2.setValue(0);
      spin3.setValue(0);
    }
  }, [visible]);

  const getRotation = (val) => val.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getRotationReverse = (val) => val.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={styles.spinnerContainer}>
          <Animated.View
            style={[
              styles.ring, styles.ring3,
              { borderColor: theme.primary + '30', transform: [{ rotate: getRotation(spin3) }] },
            ]}
          />
          <Animated.View
            style={[
              styles.ring, styles.ring2,
              { borderColor: theme.primary + '60', borderTopColor: theme.primary, transform: [{ rotate: getRotationReverse(spin2) }] },
            ]}
          />
          <Animated.View
            style={[
              styles.ring, styles.ring1,
              { borderColor: theme.primary + '40', borderTopColor: theme.secondary, transform: [{ rotate: getRotation(spin1) }] },
            ]}
          />
        </View>
        <Text style={[styles.loadingText, { color: '#FFF' }]}>{text}</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  spinnerContainer: {
    width: 80, height: 80, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute', borderWidth: 3, borderRadius: 999,
  },
  ring1: { width: 40, height: 40 },
  ring2: { width: 58, height: 58 },
  ring3: { width: 76, height: 76 },
  loadingText: { fontSize: 16, fontWeight: '600' },
});
