import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NxText } from './ui/NxText';
import { NxCard } from './ui/NxCard';
import { colors, spacing } from '../theme/tokens';
import { useCityStore } from '../stores/cityStore';

export function CitySwitcherSheet() {
  const { cities, activeCity, setCity } = useCityStore();

  return (
    <NxCard style={styles.container}>
      <NxText variant="mono" color={colors.gold} style={styles.title}>
        Select Operations City
      </NxText>

      {cities.map((city) => (
        <TouchableOpacity
          key={city.id}
          onPress={() => setCity(city.id)}
          style={[
            styles.cityRow,
            activeCity === city.id && styles.activeRow,
          ]}
        >
          <NxText
            variant="body"
            color={activeCity === city.id ? colors.gold : colors.text2}
          >
            {city.label}
          </NxText>
          {activeCity === city.id && (
            <NxText variant="mono" color={colors.gold}>✓</NxText>
          )}
        </TouchableOpacity>
      ))}
    </NxCard>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: 'rgba(0, 0, 0, 0.25)' },
  title:     { marginBottom: spacing.md, letterSpacing: 1, fontWeight: 'bold' },
  cityRow:   {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activeRow: { backgroundColor: 'rgba(201, 168, 76, 0.08)' },
});
