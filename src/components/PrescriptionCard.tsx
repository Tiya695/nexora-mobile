import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NxText } from './ui/NxText';
import { NxCard } from './ui/NxCard';
import { colors, spacing } from '../theme/tokens';
import { Prescription } from '../hooks/usePrescription';

const priorityColors: Record<string, string> = {
  low:    colors.green,
  medium: colors.orange,
  high:   colors.red,
};

interface PrescriptionCardProps {
  prescription: Prescription | null;
  loading: boolean;
  error: string;
}

export function PrescriptionCard({ prescription, loading, error }: PrescriptionCardProps) {
  if (loading) {
    return (
      <NxCard style={styles.card}>
        <ActivityIndicator color={colors.purple} />
        <NxText variant="caption" style={styles.analyzing}>
          Analyzing photo...
        </NxText>
      </NxCard>
    );
  }

  if (error) {
    return (
      <NxCard style={styles.card}>
        <NxText variant="caption" color={colors.red}>{error}</NxText>
      </NxCard>
    );
  }

  if (!prescription) return null;

  return (
    <NxCard style={styles.card}>
      <NxText variant="mono" color={colors.purple} style={styles.title}>
        AI Prescription
      </NxText>

      <View style={styles.row}>
        <NxText variant="caption">Priority</NxText>
        <View style={[styles.badge, { borderColor: priorityColors[prescription.priority] }]}>
          <NxText variant="mono" color={priorityColors[prescription.priority]}>
            {prescription.priority}
          </NxText>
        </View>
      </View>

      <View style={styles.row}>
        <NxText variant="caption">Est. Time</NxText>
        <NxText variant="caption" color={colors.gold}>
          {prescription.estimatedTime}
        </NxText>
      </View>

      <NxText variant="caption" style={styles.label}>Recommended Action</NxText>
      <NxText variant="body">{prescription.action}</NxText>

      {prescription.notes ? (
        <>
          <NxText variant="caption" style={styles.label}>Notes</NxText>
          <NxText variant="body">{prescription.notes}</NxText>
        </>
      ) : null}
    </NxCard>
  );
}

const styles = StyleSheet.create({
  card:      { marginTop: spacing.md },
  title:     { marginBottom: spacing.md },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  badge:     { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  label:     { marginTop: spacing.sm, marginBottom: spacing.xs },
  analyzing: { marginTop: spacing.sm, textAlign: 'center' },
});
