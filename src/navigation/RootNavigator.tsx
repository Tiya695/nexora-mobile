import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { AppTabs } from './AppTabs';
import { colors, spacing } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useCityStore } from '../stores/cityStore';
import { NxText } from '../components/ui/NxText';

const NexoraTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.gold,
    background: colors.bg,
    card: colors.bg2,
    text: colors.text,
    border: colors.border,
    notification: colors.gold,
  },
};

// Branded Custom Splash Loader
function CustomSplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.splashContainer}>
      <View style={styles.splashInner}>
        {/* Pulsating Brand Shield */}
        <View style={styles.splashShield}>
          <NxText variant="body" style={styles.splashShieldText}>🛡️</NxText>
        </View>
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <NxText variant="h1" color={colors.gold} style={styles.splashTitle}>
            NEXORA
          </NxText>
          <NxText variant="mono" color={colors.teal} style={styles.splashTag}>
            URBAN INTELLIGENCE NETWORK
          </NxText>
        </Animated.View>
      </View>
      <NxText variant="mono" color={colors.text3} style={styles.splashBuild}>
        NEXUS OS V4.2.0 · COMMAND NODE SECURE
      </NxText>
    </View>
  );
}

export function RootNavigator() {
  const { session, setSession } = useAuthStore();
  const [splashActive, setSplashActive] = useState(true);

  useEffect(() => {
    // Retrieve session and initialize stores asynchronously
    Promise.all([
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      }),
      useAuthStore.getState().initialize(),
      useCityStore.getState().initialize(),
    ]);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Enforce a 2.5-second splash loading delay
    const timer = setTimeout(() => {
      setSplashActive(false);
    }, 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (splashActive) {
    return <CustomSplashScreen />;
  }

  return (
    <NavigationContainer theme={NexoraTheme}>
      {session ? <AppTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashInner: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  splashShield: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
    borderColor: colors.gold,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  splashShieldText: { fontSize: 24 },
  splashTitle: { fontSize: 32, fontWeight: 'bold', letterSpacing: 4 },
  splashTag: { fontSize: 9, letterSpacing: 2, marginTop: spacing.sm, opacity: 0.8 },
  splashBuild: { fontSize: 8, letterSpacing: 1.5, marginBottom: spacing.xl },
});
