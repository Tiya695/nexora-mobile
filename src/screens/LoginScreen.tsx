import React, { useState } from 'react';
import {
  View, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableOpacity
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { NxText } from '../components/ui/NxText';
import { NxButton } from '../components/ui/NxButton';
import { colors, spacing } from '../theme/tokens';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setSession } = useAuthStore();

  const [inputFocused, setInputFocused] = useState(false);

  const sendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep('otp');
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(), token: otp.trim(), type: 'email'
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) setSession(data.session);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.backgroundDecoration} />
      <View style={styles.inner}>
        {/* Figma Command Portal Header */}
        <View style={styles.brandHeader}>
          {/* Logo Icon */}
          <View style={styles.shieldIcon}>
            <NxText variant="body" style={styles.shieldSymbol}>🛡️</NxText>
          </View>
          <NxText variant="h1" color={colors.gold} style={styles.brandName}>
            NEXORA
          </NxText>
          <NxText variant="mono" color={colors.text2} style={styles.tagline}>
            SECURE COMMAND PORTAL
          </NxText>
        </View>

        {/* Credentials Form Box */}
        <View style={styles.glassCard}>
          {step === 'email' ? (
            <>
              <NxText variant="caption" style={styles.label}>
                AGENT IDENTIFIER (EMAIL)
              </NxText>
              <TextInput
                style={[styles.input, inputFocused && styles.inputActive]}
                placeholder="Enter email identifier..."
                placeholderTextColor={colors.text3}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
              <NxButton
                label="AUTHENTICATE →"
                onPress={sendOtp}
                loading={loading}
                style={styles.actionBtn}
              />
            </>
          ) : (
            <>
              <NxText variant="caption" style={styles.label}>
                OTP ACCESS PASSCODE (SENT TO {email.toUpperCase()})
              </NxText>
              <TextInput
                style={[styles.input, styles.otpInput, inputFocused && styles.inputActive]}
                placeholder="------"
                placeholderTextColor={colors.text3}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
              <NxButton
                label="VERIFY PASSCODE →"
                onPress={verifyOtp}
                loading={loading}
                style={styles.actionBtn}
              />
              <TouchableOpacity
                onPress={() => { setStep('email'); setError(''); }}
                style={styles.changeEmailLink}
              >
                <NxText variant="caption" color={colors.gold} style={styles.changeEmailText}>
                  ← EDIT IDENTIFIER EMAIL
                </NxText>
              </TouchableOpacity>
            </>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <NxText variant="caption" color={colors.red} style={styles.error}>
                ⚠️ {error.toUpperCase()}
              </NxText>
            </View>
          ) : null}
        </View>

        {/* Encrypted Node Status Tag */}
        <View style={styles.nodeFooter}>
          <NxText variant="mono" color={colors.teal} style={styles.nodeText}>
            • ENCRYPTED NODE: SECTOR-04
          </NxText>
          <View style={styles.helpLinks}>
            <NxText variant="caption" color={colors.text3} style={styles.helpText}>
              Privacy Protocol  ·  Help Terminal
            </NxText>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backgroundDecoration: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.gold,
    opacity: 0.08,
    filter: 'blur(90px)' as any,
  },
  inner:     { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  brandHeader: { marginBottom: spacing.xl, alignItems: 'center' },
  shieldIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
    borderColor: colors.gold,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  shieldSymbol: { fontSize: 20 },
  brandName: { fontSize: 28, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center' },
  tagline:   { letterSpacing: 1.5, fontSize: 10, marginTop: 4, textAlign: 'center', opacity: 0.8 },
  glassCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.65)',
    borderColor: 'rgba(201, 168, 76, 0.25)',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: spacing.xl,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  label:     { marginBottom: spacing.sm, color: colors.text2, letterSpacing: 1, fontSize: 9, fontWeight: '700' },
  input:     {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1.5,
    borderColor: colors.border2,
    borderRadius: 8,
    color: colors.text,
    fontSize: 13,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  inputActive: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  otpInput:  {
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionBtn: { marginTop: spacing.xs, borderRadius: 8 },
  changeEmailLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    padding: 6,
  },
  changeEmailText: { fontWeight: '700', letterSpacing: 1, fontSize: 10 },
  errorContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(224, 90, 90, 0.08)',
    borderColor: 'rgba(224, 90, 90, 0.2)',
    borderWidth: 1,
    borderRadius: 6,
  },
  error:     { textAlign: 'center', fontSize: 10 },
  nodeFooter: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  nodeText:   { fontSize: 10, letterSpacing: 1 },
  helpLinks:  { marginTop: spacing.sm },
  helpText:   { fontSize: 10 },
});
