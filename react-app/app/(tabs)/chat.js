/**
 * chat.js — Main chat screen with all features
 * ChatGPT-style: sidebar drawer, persona selector, prompt library, document upload
 */
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../contexts/ChatContext';
import Sidebar from '../../components/Sidebar';
import PersonaSelector from '../../components/PersonaSelector';
import PromptLibrary from '../../components/PromptLibrary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PERSONAS_DATA = [
  { id: 'default', name: 'Default', color: '#6C63FF' },
  { id: 'creative_writer', name: 'Creative', color: '#FF6B6B' },
  { id: 'code_expert', name: 'Code Expert', color: '#00D4AA' },
  { id: 'researcher', name: 'Researcher', color: '#F59E0B' },
  { id: 'study_buddy', name: 'Study Buddy', color: '#10B981' },
  { id: 'business_advisor', name: 'Business', color: '#8B5CF6' },
];

const QUICK_ACTIONS = [
  { label: 'Summarize', text: 'Summarize this document in detail', icon: 'document-text-outline' },
  { label: 'Key Insights', text: 'Extract key insights from this content', icon: 'bulb-outline' },
  { label: 'Explain Code', text: 'Explain this code step by step:', icon: 'code-slash-outline' },
  { label: 'Write Email', text: 'Draft a professional email about', icon: 'mail-outline' },
];

// ─── Typing Indicator ──────────────────────────────────────────────
function TypingDots({ color }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={[s.typingWrap, { opacity: anim }]}>
      <Text style={[s.typingText, { color }]}>Juno is thinking...</Text>
    </Animated.View>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────
function MessageBubble({ message }) {
  const { isDark } = useTheme();
  const isUser = message.type === 'user';
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowBot]}>
      {!isUser && (
        <View style={s.botAvatar}>
          <Ionicons name="sparkles" size={14} color="#FFF" />
        </View>
      )}
      <View
        style={[
          s.bubble,
          isUser
            ? { backgroundColor: '#6C63FF', borderTopRightRadius: 4 }
            : { backgroundColor: isDark ? '#1E1E35' : '#F0F0F5', borderTopLeftRadius: 4 },
        ]}
      >
        {message.hasContext && (
          <View style={[s.ctxBadge, { backgroundColor: isDark ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.12)' }]}>
            <FontAwesome5 name="link" size={9} color="#6C63FF" />
            <Text style={s.ctxBadgeText}>Context</Text>
          </View>
        )}
        <Text
          style={[s.msgText, { color: isUser ? '#FFF' : isDark ? '#E4E4E7' : '#1A1A2E' }]}
          selectable
        >
          {message.text}
        </Text>
        <Text
          style={[s.timeText, { color: isUser ? 'rgba(255,255,255,0.6)' : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }]}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}

// ─── URL Input Modal ───────────────────────────────────────────────
function UrlModal({ visible, onClose, onSubmit, themeColors, isDark }) {
  const [url, setUrl] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.modalCard, { backgroundColor: isDark ? '#1E1E35' : '#FFF' }]}>
          <Text style={[s.modalTitle, { color: themeColors.text }]}>Web Scraping</Text>
          <Text style={[s.modalSub, { color: themeColors.textSecondary }]}>Enter a URL to scrape content from</Text>
          <TextInput
            style={[s.modalInput, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: isDark ? '#252540' : '#F5F5F5' }]}
            value={url}
            onChangeText={setUrl}
            placeholder="https://example.com"
            placeholderTextColor={themeColors.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
          />
          <View style={s.modalBtns}>
            <TouchableOpacity style={[s.modalBtn, { borderColor: themeColors.border }]} onPress={onClose}>
              <Text style={{ color: themeColors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalBtn, { backgroundColor: themeColors.primary }]}
              onPress={() => { if (url.trim()) { onSubmit(url.trim()); setUrl(''); onClose(); } }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Scrape</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Chat Screen ──────────────────────────────────────────────
export default function ChatScreen() {
  const { colors: c, isDark } = useTheme();
  const {
    messages, isTyping, activePersona, pendingInput,
    sendMessage, uploadDocument, scrapeUrl, clearChat, setPersona, setPendingInput,
  } = useChat();

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [personaVisible, setPersonaVisible] = useState(false);
  const [promptsVisible, setPromptsVisible] = useState(false);
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');

  const hasMessages = messages.length > 0;

  const activePersonaObj = useMemo(
    () => PERSONAS_DATA.find((p) => p.id === activePersona) || PERSONAS_DATA[0],
    [activePersona]
  );

  // Fill from pending input (quick actions / prompt library)
  useEffect(() => {
    if (pendingInput) {
      setInputText(pendingInput);
      setPendingInput('');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [pendingInput]);

  // Auto-scroll
  useEffect(() => {
    if (hasMessages) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages.length, isTyping]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;
    sendMessage(trimmed);
    setInputText('');
  }, [inputText, isTyping, sendMessage]);

  const handleUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        uploadDocument(file.uri, file.name);
      }
    } catch (e) {
      console.log('Document picker error:', e);
    }
  }, [uploadDocument]);

  const handlePromptSelect = useCallback((text) => {
    setInputText(text);
    setPromptsVisible(false);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handlePersonaSelect = useCallback((id) => {
    setPersona(id);
    setPersonaVisible(false);
  }, [setPersona]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={c.background} />

      {/* ─── Header ─── */}
      <View style={[s.header, { backgroundColor: c.background, borderBottomColor: c.border }]}>
        <TouchableOpacity style={s.headerBtn} onPress={() => setSidebarVisible(true)}>
          <Ionicons name="menu" size={24} color={c.text} />
        </TouchableOpacity>

        <TouchableOpacity style={s.headerCenter} onPress={() => setPersonaVisible(true)} activeOpacity={0.7}>
          <Text style={[s.headerTitle, { color: c.text }]}>JUNO AI</Text>
          <View style={[s.personaChip, { backgroundColor: activePersonaObj.color + '18' }]}>
            <View style={[s.personaDot, { backgroundColor: activePersonaObj.color }]} />
            <Text style={[s.personaLabel, { color: activePersonaObj.color }]}>{activePersonaObj.name}</Text>
            <Ionicons name="chevron-down" size={10} color={activePersonaObj.color} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.headerBtn} onPress={clearChat}>
          <Ionicons name="create-outline" size={22} color={c.text} />
        </TouchableOpacity>
      </View>

      {/* ─── Body ─── */}
      <KeyboardAvoidingView
        style={s.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {hasMessages ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => <MessageBubble message={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={isTyping ? <TypingDots color={c.primary} /> : null}
          />
        ) : (
          <ScrollView contentContainerStyle={s.welcomeScroll} showsVerticalScrollIndicator={false}>
            <View style={s.welcomeContainer}>
              <View style={[s.logoCircle, { backgroundColor: c.primary }]}>
                <Ionicons name="sparkles" size={32} color="#FFF" />
              </View>
              <Text style={[s.welcomeTitle, { color: c.text }]}>JUNO AI</Text>
              <Text style={[s.welcomeSub, { color: c.textSecondary }]}>Ready when you are.</Text>

              <View style={s.quickGrid}>
                {QUICK_ACTIONS.map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.quickCard, { backgroundColor: isDark ? c.surfaceElevated : c.surface, borderColor: c.border }]}
                    onPress={() => setInputText(a.text)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={a.icon} size={18} color={c.primary} />
                    <Text style={[s.quickLabel, { color: c.text }]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Document Status */}
            </View>
          </ScrollView>
        )}

        {/* ─── Input Bar (raised & centered text) ─── */}
        <View style={[s.inputBar, { backgroundColor: isDark ? '#1E1E35' : '#FFF', borderColor: isDark ? '#2D2D4A' : '#E5E7EB' }]}>
          {/* Action buttons */}
          <View style={s.inputActions}>
            <TouchableOpacity style={s.inputActionBtn} onPress={handleUpload}>
              <Ionicons name="add-circle-outline" size={22} color={isDark ? '#888' : '#999'} />
            </TouchableOpacity>
            <TouchableOpacity style={s.inputActionBtn} onPress={() => setPromptsVisible(true)}>
              <Ionicons name="sparkles-outline" size={20} color={isDark ? '#888' : '#999'} />
            </TouchableOpacity>
            <TouchableOpacity style={s.inputActionBtn} onPress={() => setUrlModalVisible(true)}>
              <Ionicons name="globe-outline" size={20} color={isDark ? '#888' : '#999'} />
            </TouchableOpacity>
          </View>

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={[s.input, { color: c.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask anything..."
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
            multiline
            maxLength={4000}
            textAlignVertical="center"
            blurOnSubmit={false}
          />

          {/* Send / Mic */}
          {inputText.trim() ? (
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: isTyping ? '#888' : c.primary }]}
              onPress={handleSend}
              disabled={isTyping}
            >
              <Ionicons name="arrow-up" size={20} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.inputActionBtn}>
              <Ionicons name="mic-outline" size={22} color={isDark ? '#888' : '#999'} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ─── Sidebar Drawer ─── */}
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

      {/* ─── Persona Selector Modal ─── */}
      <PersonaSelector
        visible={personaVisible}
        onClose={() => setPersonaVisible(false)}
        activePersona={activePersona}
        onSelect={handlePersonaSelect}
      />

      {/* ─── Prompt Library Modal ─── */}
      <PromptLibrary
        visible={promptsVisible}
        onClose={() => setPromptsVisible(false)}
        onSelect={handlePromptSelect}
      />

      {/* ─── URL Input Modal ─── */}
      <UrlModal
        visible={urlModalVisible}
        onClose={() => setUrlModalVisible(false)}
        onSubmit={(url) => scrapeUrl(url)}
        themeColors={c}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
    borderBottomWidth: 0.5,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 1.5 },
  personaChip: {
    flexDirection: 'row', alignItems: 'center', marginTop: 3,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, gap: 4,
  },
  personaDot: { width: 6, height: 6, borderRadius: 3 },
  personaLabel: { fontSize: 11, fontWeight: '600' },

  // Body
  body: { flex: 1 },
  messagesList: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },

  // Messages
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  botAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#6C63FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 2,
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.78, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18,
  },
  ctxBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 6, gap: 4,
  },
  ctxBadgeText: { fontSize: 10, fontWeight: '600', color: '#6C63FF' },
  msgText: { fontSize: 15, lineHeight: 22 },
  timeText: { fontSize: 10, marginTop: 4, textAlign: 'right' },

  // Typing
  typingWrap: { paddingHorizontal: 14, paddingVertical: 8, marginLeft: 36 },
  typingText: { fontSize: 13, fontStyle: 'italic' },

  // Welcome
  welcomeScroll: { flexGrow: 1 },
  welcomeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  welcomeSub: { fontSize: 16, marginBottom: 32 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 340 },
  quickCard: {
    width: (SCREEN_WIDTH - 80) / 2, paddingVertical: 16, paddingHorizontal: 14,
    borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 8,
  },
  quickLabel: { fontSize: 13, fontWeight: '600' },

  // ─── Input Bar (raised higher + centered text) ───
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1,
    marginHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 16 : 14,
    paddingHorizontal: 4,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputActionBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    paddingHorizontal: 6,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 2,
  },

  // URL Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: SCREEN_WIDTH - 48, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 16 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
});
