/**
 * Sidebar.js — ChatGPT-style sidebar drawer
 * Contains: New Chat, Search, History, Settings, Persona selector
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.78;

export default function Sidebar({ visible, onClose }) {
  const { colors: theme, isDark, setMode } = useTheme();
  const { user, token, logout } = useAuth();
  const chat = useChat();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: visible ? 0 : -SIDEBAR_WIDTH,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: visible ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  useEffect(() => {
    if (visible && token) {
      api.getConversations(token)
        .then(res => setConversations(res.conversations || res || []))
        .catch(() => setConversations([]));
    }
  }, [visible, token]);

  const handleNewChat = () => {
    chat.clearChat();
    onClose();
  };

  const handleLoadConversation = async (conv) => {
    try {
      const data = await api.loadConversation(conv.id, token);
      chat.clearChat();
      if (data.messages) {
        data.messages.forEach(m => {
          chat.dispatch?.({ type: 'ADD_MESSAGE', payload: {
            id: `loaded_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: m.role === 'user' ? 'user' : 'bot',
            text: m.content,
            timestamp: m.timestamp || new Date().toISOString(),
          }});
        });
      }
      onClose();
    } catch (e) {
      console.log('Load conversation error:', e);
    }
  };

  const handleDeleteConversation = (conv) => {
    Alert.alert('Delete', `Delete "${conv.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteConversation(conv.id, token);
            setConversations(prev => prev.filter(c => c.id !== conv.id));
          } catch (e) { console.log('Delete error:', e); }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); onClose(); } },
    ]);
  };

  const filteredConversations = conversations.filter(c =>
    !searchQuery || (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: SIDEBAR_WIDTH,
            backgroundColor: isDark ? '#171723' : '#F7F7F8',
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* New Chat Button */}
          <TouchableOpacity
            style={[styles.newChatBtn, { backgroundColor: isDark ? '#2A2A40' : '#FFFFFF', borderColor: isDark ? '#3A3A55' : '#E5E5E5' }]}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={theme.primary} />
            <Text style={[styles.newChatText, { color: theme.text }]}>New Chat</Text>
          </TouchableOpacity>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: isDark ? '#22223A' : '#EEEEEF', borderColor: isDark ? '#3A3A55' : '#E0E0E0' }]}>
            <Ionicons name="search" size={16} color={theme.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search chats..."
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Conversation List */}
          <ScrollView style={styles.conversationList} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>RECENTS</Text>
            {filteredConversations.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textTertiary }]}>No conversations yet</Text>
            ) : (
              filteredConversations.map((conv, i) => (
                <TouchableOpacity
                  key={conv.id || i}
                  style={[styles.convItem, { backgroundColor: 'transparent' }]}
                  onPress={() => handleLoadConversation(conv)}
                  onLongPress={() => handleDeleteConversation(conv)}
                  activeOpacity={0.6}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.convTitle, { color: theme.text }]} numberOfLines={1}>
                    {conv.title || 'Untitled Chat'}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Bottom Section */}
          <View style={[styles.bottomSection, { borderTopColor: isDark ? '#2D2D4A' : '#E5E5E5' }]}>
            {/* Theme Toggle */}
            <TouchableOpacity
              style={styles.bottomItem}
              onPress={() => setMode(isDark ? 'light' : 'dark')}
            >
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={theme.textSecondary} />
              <Text style={[styles.bottomText, { color: theme.text }]}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>

            {/* Clear Session */}
            <TouchableOpacity
              style={styles.bottomItem}
              onPress={() => { chat.clearChat(); onClose(); }}
            >
              <MaterialCommunityIcons name="broom" size={18} color={theme.textSecondary} />
              <Text style={[styles.bottomText, { color: theme.text }]}>Clear Session</Text>
            </TouchableOpacity>

            {/* User / Logout */}
            <TouchableOpacity style={styles.bottomItem} onPress={handleLogout}>
              <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {(user?.name || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                  {user?.name || 'User'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.textTertiary }]} numberOfLines={1}>
                  {user?.email || ''}
                </Text>
              </View>
              <Ionicons name="log-out-outline" size={18} color={theme.error} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 25,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  newChatText: { fontSize: 15, fontWeight: '600' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  conversationList: { flex: 1, marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  emptyText: { fontSize: 13, marginLeft: 4, marginTop: 4 },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  convTitle: { fontSize: 14, flex: 1 },
  bottomSection: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 2,
  },
  bottomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  bottomText: { fontSize: 14, fontWeight: '500', flex: 1 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600' },
  userEmail: { fontSize: 11 },
});
