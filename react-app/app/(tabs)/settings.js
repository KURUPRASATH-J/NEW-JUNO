import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { router } from 'expo-router';
import MemoryModal from '../../components/MemoryModal';

export default function SettingsScreen() {
  const { colors: theme, mode, setMode, isDark } = useTheme();
  const { user, token, logout } = useAuth();
  const [memoryVisible, setMemoryVisible] = useState(false);

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleClearSession = () => {
    Alert.alert('Clear Session', 'This will clear all chat history and memory. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          try {
            await api.clearSession(token);
            Alert.alert('Done', 'Session cleared successfully');
          } catch (e) { Alert.alert('Error', 'Failed to clear session'); }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const themes = [
    { id: 'light', icon: 'sunny', label: 'Light' },
    { id: 'dark', icon: 'moon', label: 'Dark' },
    { id: 'system', icon: 'phone-portrait-outline', label: 'System' },
  ];

  const SettingRow = ({ icon, iconColor, title, subtitle, onPress, rightElement, danger }) => (
    <TouchableOpacity
      style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, { backgroundColor: (iconColor || theme.primary) + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor || theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: danger ? theme.error : theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email || 'user@email.com'}</Text>
          </View>
          <TouchableOpacity style={[styles.editProfileBtn, { borderColor: theme.border }]}>
            <Ionicons name="pencil" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.themeContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {themes.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.themeBtn,
                {
                  backgroundColor: mode === t.id ? theme.primary : 'transparent',
                  borderColor: mode === t.id ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setMode(t.id)}
            >
              <Ionicons
                name={t.icon}
                size={20}
                color={mode === t.id ? '#FFF' : theme.textSecondary}
              />
              <Text style={[
                styles.themeLabel,
                { color: mode === t.id ? '#FFF' : theme.textSecondary },
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Settings */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APP</Text>
        <View style={styles.settingsGroup}>
          <SettingRow
            icon="brain-outline"
            title="Memory & Session"
            subtitle="View stored data and session info"
            onPress={() => setMemoryVisible(true)}
            iconColor="#8B5CF6"
          />
          <SettingRow
            icon="refresh-outline"
            title="Clear Session"
            subtitle="Reset chat history and memory"
            onPress={handleClearSession}
            iconColor="#F59E0B"
          />
          <SettingRow
            icon="information-circle-outline"
            title="About"
            subtitle="JUNO AI v1.0.0"
            onPress={() => Alert.alert('JUNO AI', 'Version 1.0.0\n\nAdvanced AI Assistant with Document Processing, Web Scraping, and Memory.\n\nPowered by Google Gemini AI')}
            iconColor="#00D4AA"
          />
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: theme.error }]}>ACCOUNT</Text>
        <View style={styles.settingsGroup}>
          <SettingRow
            icon="log-out-outline"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            iconColor={theme.error}
            danger
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            Built with ❤️ using Juno AI
          </Text>
          <Text style={[styles.footerVersion, { color: theme.textTertiary }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>

      <MemoryModal visible={memoryVisible} onClose={() => setMemoryVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  headerTitle: { fontSize: 24, fontWeight: '700', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  profileEmail: { fontSize: 13 },
  editProfileBtn: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1, paddingHorizontal: 20,
    marginBottom: 10, marginTop: 4,
  },
  themeContainer: {
    flexDirection: 'row', marginHorizontal: 16, padding: 6,
    borderRadius: 14, borderWidth: 1, marginBottom: 24, gap: 6,
  },
  themeBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 10, borderRadius: 10, borderWidth: 1, gap: 6,
  },
  themeLabel: { fontSize: 13, fontWeight: '600' },
  settingsGroup: { marginHorizontal: 16, marginBottom: 24, gap: 8 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 1, gap: 12,
  },
  settingIcon: {
    width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingSubtitle: { fontSize: 12 },
  footer: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  footerText: { fontSize: 13, marginBottom: 4 },
  footerVersion: { fontSize: 11 },
});
