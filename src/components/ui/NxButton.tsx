 import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';
import { NxText } from './NxText';

interface NxButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
}

export function NxButton({ label, onPress, variant = 'primary', loading, disabled, style, textColor }: NxButtonProps) {
  const activeColor = textColor ?? (variant === 'primary' ? colors.bg : colors.purple);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator color={activeColor} size="small" />
        : <NxText variant="label" color={activeColor}>{label}</NxText>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:      { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  primary:   { backgroundColor: colors.gold },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.purple },
  ghost:     { backgroundColor: 'transparent' },
  disabled:  { opacity: 0.4 },
});
