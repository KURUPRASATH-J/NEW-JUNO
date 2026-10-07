import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { promptLibrary } from '../constants/prompts';

const { height } = Dimensions.get('window');

export default function PromptLibrary({ visible, onClose, onSelect }) {
  const { colors: theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);

  const filteredLibrary = promptLibrary.map(category => ({
    ...category,
    prompts: category.prompts.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.text.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.prompts.length > 0);

  const handleSelect = (text) => {
    onSelect(text);
    onClose();
    setSearchQuery('');
    setExpandedCategory(null);
  };

  const toggleCategory = (index) => {
    setExpandedCategory(expandedCategory === index ? null : index);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.card, { backgroundColor: theme.surface, maxHeight: height * 0.75 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>✨ Prompt Library</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.card }]}>
              <FontAwesome5 name="times" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="search" size={16} color={theme.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search prompts..."
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Categories */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {filteredLibrary.map((category, catIndex) => (
              <View key={category.category} style={styles.categorySection}>
                <TouchableOpacity
                  style={[styles.categoryHeader, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => toggleCategory(catIndex)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    <FontAwesome5 name={category.icon} size={16} color={category.color} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: theme.text }]}>{category.category}</Text>
                    <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>
                      {category.prompts.length} prompts
                    </Text>
                  </View>
                  <Ionicons
                    name={expandedCategory === catIndex ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.textTertiary}
                  />
                </TouchableOpacity>

                {expandedCategory === catIndex && (
                  <View style={styles.promptsList}>
                    {category.prompts.map((prompt, pIndex) => (
                      <TouchableOpacity
                        key={pIndex}
                        style={[styles.promptItem, { backgroundColor: theme.background, borderColor: theme.borderLight }]}
                        onPress={() => handleSelect(prompt.text)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.promptDot, { backgroundColor: category.color }]} />
                        <View style={styles.promptContent}>
                          <Text style={[styles.promptTitle, { color: theme.text }]}>{prompt.title}</Text>
                          <Text style={[styles.promptText, { color: theme.textSecondary }]} numberOfLines={1}>
                            {prompt.text}
                          </Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={20} color={category.color} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {filteredLibrary.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No prompts match your search
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  card: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15, shadowRadius: 15, elevation: 10,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8, marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14 },
  categoriesContainer: { paddingBottom: 20 },
  categorySection: { marginBottom: 10 },
  categoryHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 1, gap: 12,
  },
  categoryIcon: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  categoryCount: { fontSize: 11 },
  promptsList: { marginTop: 6, marginLeft: 20, gap: 4 },
  promptItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 10, borderWidth: 1, gap: 10,
  },
  promptDot: { width: 6, height: 6, borderRadius: 3 },
  promptContent: { flex: 1 },
  promptTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  promptText: { fontSize: 12 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, marginTop: 12 },
});
