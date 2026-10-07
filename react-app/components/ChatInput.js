/**
 * ChatInput.js — Clean floating input bar (ChatGPT-style)
 * Features: auto-resize, action buttons, voice/send toggle
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

function ChatInput({
  onSend,
  onUpload,
  onScrape,
  onVoice,
  onPromptLibrary,
  onPersona,
  pendingInput,
  onClearPending,
  isTyping,
}) {
  const { isDark, colors: theme } = useTheme();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const sendScale = useRef(new Animated.Value(0)).current;
  const hasText = text.trim().length > 0;

  useEffect(() => {
    Animated.spring(sendScale, {
      toValue: hasText ? 1 : 0,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [hasText]);

  useEffect(() => {
    if (pendingInput) {
      setText(pendingInput);
      onClearPending?.();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [pendingInput]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    onSend?.(trimmed);
    setText('');
    Keyboard.dismiss();
  }, [text, isTyping, onSend]);

  const micOpacity = sendScale.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1E1E35' : '#FFFFFF',
          borderColor: isFocused ? (theme.primary + '50') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
          shadowColor: isDark ? '#000' : '#888',
        },
      ]}
    >
      {/* Action buttons row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onUpload} activeOpacity={0.6}>
          <Ionicons name="add-circle-outline" size={22} color={isDark ? '#888' : '#999'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onPromptLibrary} activeOpacity={0.6}>
          <Ionicons name="sparkles-outline" size={20} color={isDark ? '#888' : '#999'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onScrape} activeOpacity={0.6}>
          <Ionicons name="globe-outline" size={20} color={isDark ? '#888' : '#999'} />
        </TouchableOpacity>
      </View>

      {/* Text input */}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: isDark ? '#E4E4E7' : '#1A1A2E' }]}
          value={text}
          onChangeText={setText}
          placeholder="Ask anything..."
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
          multiline
          maxLength={4000}
          textAlignVertical="center"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          blurOnSubmit={false}
        />
      </View>

      {/* Voice / Send */}
      <View style={styles.rightSection}>
        <Animated.View pointerEvents={hasText ? 'none' : 'auto'} style={[styles.absCenter, { opacity: micOpacity }]}>
          <TouchableOpacity style={styles.micBtn} onPress={onVoice} activeOpacity={0.6}>
            <Ionicons name="mic-outline" size={22} color={isDark ? '#888' : '#999'} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          pointerEvents={hasText ? 'auto' : 'none'}
          style={[styles.absCenter, { opacity: sendScale, transform: [{ scale: sendScale }] }]}
        >
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: isTyping ? '#555' : theme.primary }]}
            onPress={handleSend}
            disabled={isTyping}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 10,
    marginBottom: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: 4,
    paddingVertical: 5,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 3,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 1,
  },
  input: {
    fontSize: 15,
    lineHeight: 21,
    maxHeight: 120,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
  },
  rightSection: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  absCenter: { position: 'absolute' },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatInput;
