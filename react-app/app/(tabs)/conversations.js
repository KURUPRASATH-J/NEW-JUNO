import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import api from '../../services/api';
import { router } from 'expo-router';

export default function ConversationsScreen() {
  const { colors: theme } = useTheme();
  const { token } = useAuth();
  const chat = useChat();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recents');

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.getConversations(token);
      setConversations(data.conversations || []);
    } catch (e) {
      console.log('Failed to fetch conversations:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleLoad = async (id) => {
    try {
      const data = await api.loadConversation(id, token);
      if (data.conversation) {
        const msgs = data.conversation.messages.map((m, i) => ([
          { id: `${id}-u-${i}`, type: 'user', text: m.user, timestamp: m.timestamp },
          { id: `${id}-b-${i}`, type: 'bot', text: m.bot, timestamp: m.timestamp },
        ])).flat();
        chat.clearChat(true); // silent clear
        msgs.forEach(m => chat.addMessage && chat.addMessage(m));
        router.navigate('/(tabs)/chat');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load conversation');
    }
  };

  const handleDelete = (id, title) => {
    Alert.alert('Delete Conversation', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteConversation(id, token);
            setConversations(prev => prev.filter(c => c.id !== id));
          } catch (e) { Alert.alert('Error', 'Failed to delete'); }
        },
      },
    ]);
  };

  const handleRename = (id, currentTitle) => {
    Alert.prompt('Rename Conversation', 'Enter new title:', async (newTitle) => {
      if (newTitle && newTitle.trim()) {
        try {
          await api.renameConversation(id, newTitle.trim(), token);
          setConversations(prev =>
            prev.map(c => c.id === id ? { ...c, title: newTitle.trim() } : c)
          );
        } catch (e) { Alert.alert('Error', 'Failed to rename'); }
      }
    }, 'plain-text', currentTitle);
  };

  const handleSaveCurrent = async () => {
    try {
      const id = Date.now().toString();
      await api.saveConversation(id, '', token);
      Alert.alert('Saved', 'Current conversation saved successfully');
      fetchConversations();
    } catch (e) {
      Alert.alert('Error', 'Failed to save conversation');
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'recents', label: 'Recents', icon: 'time-outline' },
    { id: 'pinned', label: 'Pinned', icon: 'bookmark-outline' },
    { id: 'archived', label: 'Archived', icon: 'archive-outline' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={[styles.convItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => handleLoad(item.id)}
      onLongPress={() => Platform.OS === 'ios' ?
        handleRename(item.id, item.title) :
        Alert.alert('Options', '', [
          { text: 'Rename', onPress: () => handleRename(item.id, item.title) },
          { text: 'Delete', onPress: () => handleDelete(item.id, item.title), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ])
      }
      activeOpacity={0.7}
    >
      <View style={[styles.convIcon, { backgroundColor: theme.primary + '15' }]}>
        <Ionicons name="chatbubbles-outline" size={20} color={theme.primary} />
      </View>
      <View style={styles.convContent}>
        <Text style={[styles.convTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.convMeta, { color: theme.textSecondary }]}>
          {formatDate(item.last_updated)} · {item.message_count || 0} messages
        </Text>
      </View>
      <TouchableOpacity
        style={styles.convDeleteBtn}
        onPress={() => handleDelete(item.id, item.title)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color={theme.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '10' }]}>
        <FontAwesome5 name="comments" size={40} color={theme.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Conversations Yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Start chatting with Juno AI and save your conversations here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Conversations</Text>
        <TouchableOpacity onPress={handleSaveCurrent} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
          <Ionicons name="save-outline" size={16} color="#FFF" />
          <Text style={styles.saveBtnText}>Save Current</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search conversations..."
          placeholderTextColor={theme.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tab Pills */}
      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabPill,
              {
                backgroundColor: activeTab === tab.id ? theme.primary : theme.surface,
                borderColor: activeTab === tab.id ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={14}
              color={activeTab === tab.id ? '#FFF' : theme.textSecondary}
            />
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.id ? '#FFF' : theme.textSecondary },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={filteredConversations.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 20, gap: 6,
  },
  saveBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    marginTop: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  tabsContainer: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6,
  },
  tabLabel: { fontSize: 13, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  convItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    marginBottom: 8, borderRadius: 14, borderWidth: 1, gap: 12,
  },
  convIcon: {
    width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  convContent: { flex: 1 },
  convTitle: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  convMeta: { fontSize: 12 },
  convDeleteBtn: { padding: 6 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45, justifyContent: 'center',
    alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
