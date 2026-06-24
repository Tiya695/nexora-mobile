import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'mono' | 'label';

interface NxTextProps {
  variant?: Variant;
  color?: string;
  style?: TextStyle;
  children: React.ReactNode;
  numberOfLines?: number;
}

export function NxText({ variant = 'body', color, style, children, numberOfLines }: NxTextProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles[variant], color ? { color } : {}, style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1:      { fontSize: 32, fontWeight: '300', color: colors.text, letterSpacing: -1, lineHeight: 36 },
  h2:      { fontSize: 22, fontWeight: '300', color: colors.text, letterSpacing: -0.5 },
  h3:      { fontSize: 16, fontWeight: '400', color: colors.text },
  body:    { fontSize: 14, fontWeight: '300', color: colors.text2, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '300', color: colors.text3, lineHeight: 18 },
  mono:    { fontSize: 11, color: colors.text3, letterSpacing: 1.5, textTransform: 'uppercase' },
  label:   { fontSize: 12, fontWeight: '400', color: colors.text, letterSpacing: 0.5 },
});
