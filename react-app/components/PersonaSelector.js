import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const PERSONAS = [
  { id: 'default', name: 'Default', icon: 'robot', color: '#6C63FF', description: 'Balanced and helpful assistant' },
  { id: 'creative_writer', name: 'Creative Writer', icon: 'palette', color: '#FF6B6B', description: 'Rich, artistic, and expressive responses' },
  { id: 'code_expert', name: 'Code Expert', icon: 'laptop-code', color: '#00D4AA', description: 'Technical precision with code examples' },
  { id: 'researcher', name: 'Researcher', icon: 'flask', color: '#F59E0B', description: 'Academic and evidence-based analysis' },
  { id: 'study_buddy', name: 'Study Buddy', icon: 'book-open', color: '#10B981', description: 'Simplified learning with analogies' },
  { id: 'business_advisor', name: 'Business Advisor', icon: 'chart-line', color: '#8B5CF6', description: 'Strategic and results-oriented advice' },
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64 - 12) / 2;

export default function PersonaSelector({ visible, onClose, activePersona, onSelect }) {
  const { colors: theme } = useTheme();

  const handleSelect = (id) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>🎭 AI Personas</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Choose a personality mode for JUNO AI
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.card }]}>
              <FontAwesome5 name="times" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Grid */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
            {PERSONAS.map((persona) => {
              const isActive = activePersona === persona.id;
              return (
                <TouchableOpacity
                  key={persona.id}
                  style={[
                    styles.personaCard,
                    {
                      backgroundColor: isActive ? persona.color + '15' : theme.card,
                      borderColor: isActive ? persona.color : theme.border,
                      width: CARD_WIDTH,
                    },
                  ]}
                  onPress={() => handleSelect(persona.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: persona.color + '20' }]}>
                    <FontAwesome5 name={persona.icon} size={20} color={persona.color} />
                  </View>
                  {isActive && (
                    <View style={[styles.checkBadge, { backgroundColor: persona.color }]}>
                      <FontAwesome5 name="check" size={8} color="#FFF" />
                    </View>
                  )}
                  <Text style={[styles.personaName, { color: theme.text }]}>{persona.name}</Text>
                  <Text style={[styles.personaDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {persona.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  card: {
    width: '100%', maxHeight: '80%', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 10,
  },
  personaCard: {
    padding: 16, borderRadius: 14, borderWidth: 1.5, position: 'relative',
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center',
    alignItems: 'center', marginBottom: 10,
  },
  checkBadge: {
    position: 'absolute', top: 10, right: 10, width: 20, height: 20,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  personaName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  personaDesc: { fontSize: 11, lineHeight: 15 },
});
