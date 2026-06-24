import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { NxText } from './ui/NxText';
import { colors, spacing } from '../theme/tokens';

interface BeforeAfterPairProps {
  beforeUri?: string;
  afterUri?: string;
  onTakeAfter?: () => void;
}

export function BeforeAfterPair({ beforeUri, afterUri, onTakeAfter }: BeforeAfterPairProps) {
  return (
    <View style={styles.container}>
      <View style={styles.photoBox}>
        <NxText variant="mono" color={colors.text3} style={styles.photoLabel}>Before</NxText>
        {beforeUri
          ? <Image source={{ uri: beforeUri }} style={styles.photo} />
          : <View style={styles.empty}><NxText variant="caption">No photo</NxText></View>
        }
      </View>

      <View style={styles.divider} />

      <View style={styles.photoBox}>
        <NxText variant="mono" color={colors.text3} style={styles.photoLabel}>After</NxText>
        {afterUri
          ? <Image source={{ uri: afterUri }} style={styles.photo} />
          : (
            <TouchableOpacity style={styles.empty} onPress={onTakeAfter}>
              <NxText variant="caption" color={colors.purple}>Tap to capture</NxText>
            </TouchableOpacity>
          )
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flexDirection: 'row', gap: spacing.sm },
  photoBox:   { flex: 1 },
  photoLabel: { marginBottom: spacing.xs },
  photo:      { width: '100%', height: 160 },
  empty:      {
    width: '100%', height: 160,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  divider:    { width: 1, backgroundColor: colors.border2 },
});
