 import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { colors, spacing } from '../../theme/tokens';

interface NxCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'surface';
}

export function NxCard({ children, style, variant = 'default' }: NxCardProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base:    {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  default: { backgroundColor: colors.bg2 },
  surface: { backgroundColor: colors.surface },
});
