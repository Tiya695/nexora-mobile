import React, { useState, useRef } from 'react';
import {
  View, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator
} from 'react-native';
import { NxText } from '../components/ui/NxText';
import { colors, spacing } from '../theme/tokens';
import { useSmartCityAgent } from '../hooks/useSmartCityAgent';
import { InfrastructureMap } from '../components/InfrastructureMap';

const CATEGORY_CHIPS = [
  { label: '🛣️ Road', value: 'Road' },
  { label: '💧 Water', value: 'Water' },
  { label: '⚡ Electricity', value: 'Electricity' },
  { label: '♻️ Sanitation', value: 'Sanitation' },
  { label: '🏙️ Other', value: 'Other' },
];

export function SmartCityAgentScreen({
  onClose,
  complaint,
}: {
  onClose?: () => void;
  complaint?: any;
}) {
  console.log('SmartCityAgentScreen rendered with complaint:', complaint?.id ?? 'NONE');
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { messages, loading, sendMessage } = useSmartCityAgent(complaint);
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async () => {
  if (!input.trim()) return;
  const text = input.trim();
  setInput('');
  setSelectedCategory(null);
  console.log('Complaint passed to sendMessage:', JSON.stringify(complaint));
  await sendMessage(text, complaint);
  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <NxText variant="mono" color={colors.gold}>AI ASSISTANT</NxText>
          <NxText variant="h3">🏙️ Nexora Smart Planner</NxText>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <NxText variant="body" color={colors.text3}>✕</NxText>
          </TouchableOpacity>
        )}
      </View>
      

      <KeyboardAvoidingView
        style={styles.bottomArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
  <View key={msg.id}>
    <View
      style={[
        styles.bubble,
        msg.role === 'user' ? styles.userBubble : styles.agentBubble
      ]}
    >
      <NxText
        variant="body"
        color={msg.role === 'user' ? colors.bg : colors.text}
      >
        {msg.text}
      </NxText>
    </View>
    {msg.latitude && msg.longitude && (
      <View style={styles.sceneWrapper}>
        <NxText variant="mono" color={colors.gold} style={styles.sceneLabel}>
          🏗️ Real nearby infrastructure (Google Maps)
        </NxText>
        <InfrastructureMap
          latitude={msg.latitude}
          longitude={msg.longitude}
          features={msg.features}
        />
      </View>
    )}
  </View>
))}
          {loading && (
            <View style={styles.agentBubble}>
              <ActivityIndicator color={colors.gold} size="small" />
            </View>
          )}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}
        >
          {CATEGORY_CHIPS.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            const isDisabled = selectedCategory !== null && !isSelected;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.chip, isSelected && styles.chipSelected, isDisabled && styles.chipDisabled]}
                disabled={isDisabled}
                onPress={() => {
                  setSelectedCategory(cat.value);
                  setInput(`${cat.value} issue: `);
                }}
              >
                <NxText
                  variant="label"
                  color={isDisabled ? colors.text3 : colors.gold}
                  style={{ fontWeight: '700' }}
                >
                  {cat.label}
                </NxText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Describe the issue and location..."
            placeholderTextColor={colors.text3}
            value={input}
            onChangeText={(t) => {
              setInput(t);
              if (!t.trim()) setSelectedCategory(null);
            }}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendBtn}
            disabled={loading}
          >
            <NxText variant="label" color={colors.bg}>Send</NxText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bg },
  header:          {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn:        { padding: spacing.sm },
  bottomArea:      { flex: 1, justifyContent: 'flex-end' },
  messagesContent: { padding: spacing.md, gap: 12, flexGrow: 1, justifyContent: 'flex-end' },
  bubble:          { maxWidth: '85%', padding: spacing.md, marginBottom: 4, borderRadius: 16 },
  userBubble:      { alignSelf: 'flex-end', backgroundColor: colors.gold, borderBottomRightRadius: 4 },
  agentBubble:     {
    alignSelf: 'flex-start', backgroundColor: colors.surface,
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border,
  },
  sceneWrapper:    { marginTop: 8, marginBottom: 8 },
 sceneLabel:      { marginBottom: 6, fontSize: 10 },
  chipsRow:        {
  borderTopWidth: 1, borderTopColor: colors.border,
  paddingTop: spacing.sm, paddingBottom: spacing.sm,
  height: 56, flexGrow: 0, flexShrink: 0,
},
  chipsContent:    { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center' },
  chip:            {
    backgroundColor: 'rgba(201,168,76,0.12)', borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  chipSelected:    { backgroundColor: 'rgba(201,168,76,0.3)', borderColor: colors.gold },
  chipDisabled:    { opacity: 0.35 },
  inputRow:        {
    flexDirection: 'row', padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    gap: spacing.sm, alignItems: 'flex-end',
  },
  input:           {
    flex: 1, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border2,
    color: colors.text, padding: spacing.md,
    maxHeight: 100, borderRadius: 8,
  },
  sendBtn:         {
    backgroundColor: colors.gold, padding: spacing.md,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
});