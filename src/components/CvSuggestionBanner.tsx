import React from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NxText } from './ui/NxText';
import { colors, spacing } from '../theme/tokens';

interface CvSuggestion {
  category: string;
  title: string;
  confidence: number;
}

interface CvSuggestionBannerProps {
  suggestion: CvSuggestion | null;
  loading: boolean;
  onAccept: (suggestion: CvSuggestion) => void;
  onDismiss: () => void;
}

export function CvSuggestionBanner({
  suggestion,
  loading,
  onAccept,
  onDismiss,
}: CvSuggestionBannerProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.teal} size="small" />
        <NxText variant="caption" color={colors.teal} style={styles.text}>
          Analysing photo...
        </NxText>
      </View>
    );
  }

  if (!suggestion || suggestion.confidence < 0.7) return null;

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <NxText variant="mono" color={colors.teal}>CV Suggestion</NxText>
        <NxText variant="body" style={styles.text}>
          {suggestion.title}
        </NxText>
        <NxText variant="caption" color={colors.text3}>
          {suggestion.category} · {Math.round(suggestion.confidence * 100)}% confidence
        </NxText>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onAccept(suggestion)}
          style={styles.acceptBtn}
        >
          <NxText variant="mono" color={colors.teal}>Accept</NxText>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <NxText variant="mono" color={colors.text3}>Dismiss</NxText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,201,192,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(76,201,192,0.3)',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  info:       { flex: 1 },
  text:       { marginTop: 2, marginBottom: 2 },
  actions:    { gap: spacing.sm },
  acceptBtn:  { paddingVertical: 4 },
  dismissBtn: { paddingVertical: 4 },
});
