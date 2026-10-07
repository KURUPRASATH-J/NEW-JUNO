/**
 * ChatBubble.js
 *
 * A chat message bubble component for the Juno AI app.
 * Supports user and bot message styling, basic markdown rendering,
 * animated entrance, copy/edit actions, context badges, and edited labels.
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.85;

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

/**
 * Parse a string and return an array of React Native Text / View elements
 * supporting **bold**, `inline code`, and ```code blocks```.
 */
function renderMarkdown(text, textColor, isDark) {
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  // First pass: split by code blocks
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'codeblock', value: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts.map((part, i) => {
    if (part.type === 'codeblock') {
      return (
        <View
          key={`cb-${i}`}
          style={[
            markdownStyles.codeBlock,
            { backgroundColor: isDark ? '#1E1E2E' : '#F1F3F5' },
          ]}
        >
          <Text
            style={[
              markdownStyles.codeBlockText,
              { color: isDark ? '#A6E3A1' : '#2D3436' },
            ]}
          >
            {part.value}
          </Text>
        </View>
      );
    }

    // Second pass: inline markdown (**bold**, `code`)
    return renderInlineMarkdown(part.value, textColor, isDark, i);
  });
}

function renderInlineMarkdown(text, textColor, isDark, keyPrefix) {
  const inlineRegex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <Text key={`${keyPrefix}-t-${lastIndex}`} style={{ color: textColor }}>
          {text.slice(lastIndex, match.index)}
        </Text>,
      );
    }

    if (match[2]) {
      // Bold
      elements.push(
        <Text
          key={`${keyPrefix}-b-${match.index}`}
          style={{ color: textColor, fontWeight: '700' }}
        >
          {match[2]}
        </Text>,
      );
    } else if (match[3]) {
      // Inline code
      elements.push(
        <Text
          key={`${keyPrefix}-c-${match.index}`}
          style={[
            markdownStyles.inlineCode,
            {
              color: isDark ? '#A6E3A1' : '#E74C3C',
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          {match[3]}
        </Text>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    elements.push(
      <Text key={`${keyPrefix}-t-${lastIndex}`} style={{ color: textColor }}>
        {text.slice(lastIndex)}
      </Text>,
    );
  }

  return (
    <Text key={`inline-${keyPrefix}`} style={{ color: textColor }}>
      {elements}
    </Text>
  );
}

const markdownStyles = StyleSheet.create({
  codeBlock: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    overflow: 'hidden',
  },
  codeBlockText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
});

// ---------------------------------------------------------------------------
// ChatBubble
// ---------------------------------------------------------------------------

function ChatBubble({ message, onEdit, index }) {
  const { isDark } = useTheme();
  const isUser = message.type === 'user';

  // Animation
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Long-press copy / edit states
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ---------- theme-derived colours ----------
  const theme = useMemo(() => {
    const userBubble = '#6C63FF';
    const userBubbleEnd = '#8B5CF6';
    return {
      userBubble,
      userBubbleEnd,
      botBubble: isDark ? '#1E1E2E' : '#F0F0F5',
      userText: '#FFFFFF',
      botText: isDark ? '#E4E4E7' : '#1A1A2E',
      timestamp: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)',
      actionBg: isDark ? '#2A2A3E' : '#FFFFFF',
      actionBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      badgeBg: isDark ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.15)',
      badgeText: '#6C63FF',
      editedColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
    };
  }, [isDark]);

  const textColor = isUser ? theme.userText : theme.botText;

  // ---------- handlers ----------
  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.text]);

  const handleEditSubmit = useCallback(() => {
    if (editText.trim() && editText !== message.text) {
      onEdit?.(index, editText.trim());
    }
    setIsEditing(false);
    setShowActions(false);
  }, [editText, message.text, onEdit, index]);

  const handleLongPress = useCallback(() => {
    setShowActions(true);
  }, []);

  // ---------- timestamp formatting ----------
  const formattedTime = useMemo(() => {
    if (!message.timestamp) return '';
    const d = new Date(message.timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [message.timestamp]);

  // ---------- render ----------
  return (
    <Animated.View
      style={[
        styles.wrapper,
        isUser ? styles.wrapperUser : styles.wrapperBot,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {/* Bot avatar */}
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: theme.userBubble }]}>
          <FontAwesome5 name="robot" size={14} color="#FFFFFF" />
        </View>
      )}

      <Pressable
        onLongPress={handleLongPress}
        onPress={() => showActions && setShowActions(false)}
        style={{ maxWidth: MAX_BUBBLE_WIDTH }}
      >
        <View
          style={[
            styles.bubble,
            isUser
              ? [
                  styles.bubbleUser,
                  {
                    backgroundColor: theme.userBubble,
                    shadowColor: '#6C63FF',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  },
                ]
              : [styles.bubbleBot, { backgroundColor: theme.botBubble }],
          ]}
        >
          {/* Context badge */}
          {message.hasContext && (
            <View style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
              <FontAwesome5 name="link" size={9} color={theme.badgeText} />
              <Text style={[styles.badgeText, { color: theme.badgeText }]}>
                Context
              </Text>
            </View>
          )}

          {/* Message body */}
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.editInput, { color: textColor, borderColor: theme.actionBorder }]}
                value={editText}
                onChangeText={setEditText}
                multiline
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={handleEditSubmit}
                  style={[styles.editBtn, { backgroundColor: theme.userBubble }]}
                >
                  <FontAwesome5 name="check" size={12} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setEditText(message.text);
                  }}
                  style={[styles.editBtn, { backgroundColor: isDark ? '#444' : '#CCC' }]}
                >
                  <FontAwesome5 name="times" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.textContainer}>
              {renderMarkdown(message.text, textColor, isDark)}
            </View>
          )}

          {/* Bottom row: edited + timestamp */}
          <View style={styles.metaRow}>
            {message.isEdited && (
              <Text style={[styles.editedLabel, { color: theme.editedColor }]}>
                edited
              </Text>
            )}
            {formattedTime ? (
              <Text style={[styles.timestamp, { color: theme.timestamp }]}>
                {formattedTime}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Action buttons (on long press) */}
        {showActions && (
          <View
            style={[
              styles.actionsBar,
              {
                backgroundColor: theme.actionBg,
                borderColor: theme.actionBorder,
                alignSelf: isUser ? 'flex-end' : 'flex-start',
              },
            ]}
          >
            <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
              <FontAwesome5
                name={copied ? 'check' : 'copy'}
                size={14}
                color={copied ? '#10B981' : theme.botText}
              />
              <Text style={[styles.actionLabel, { color: theme.botText }]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>

            {isUser && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setIsEditing(true);
                  setShowActions(false);
                }}
              >
                <FontAwesome5 name="pencil-alt" size={14} color={theme.botText} />
                <Text style={[styles.actionLabel, { color: theme.botText }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperBot: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  bubbleUser: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  bubbleBot: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  textContainer: {
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  timestamp: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  editedLabel: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // ------ actions ------
  actionsBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  // ------ editing ------
  editContainer: {
    minWidth: 200,
  },
  editInput: {
    fontSize: 15,
    lineHeight: 21,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    minHeight: 40,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatBubble;
