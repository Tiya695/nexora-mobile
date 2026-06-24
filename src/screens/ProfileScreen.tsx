import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Modal } from 'react-native';
import { NxText } from '../components/ui/NxText';
import { NxCard } from '../components/ui/NxCard';
import { NxButton } from '../components/ui/NxButton';
import { colors, spacing } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { useCityStore } from '../stores/cityStore';
import { useRealtimeComplaints } from '../hooks/useRealtimeComplaints';
import { CitySwitcherSheet } from '../components/CitySwitcherSheet';

export function ProfileScreen() {
  const { user, role, setRole, signOut } = useAuthStore();
  const {
    activeCity,
    activeWard,
    syncActive,
    setSyncActive,
    bufferSize,
    setBufferSize,
    authStatus,
    setAuthStatus
  } = useCityStore();
  const { complaints } = useRealtimeComplaints(activeCity.toLowerCase());
  const [tapCount, setTapCount] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  const completedRepairs = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const cityName = activeCity.charAt(0).toUpperCase() + activeCity.slice(1).toLowerCase();

  const handleUserIdTap = () => {
    const nextCount = tapCount + 1;
    if (nextCount >= 5) {
      setDevMode(prev => !prev);
      setTapCount(0);
      Alert.alert(
        "Developer Terminal Mode",
        !devMode ? "Cheat Mode Active: Toggles enabled." : "Cheat Mode Inactive: Toggles hidden."
      );
    } else {
      setTapCount(nextCount);
    }
  };

  const handlePurgeBuffer = () => {
    Alert.alert(
      "Purge Storage Buffer",
      "Purging local storage buffer will clear on-device cached telemetry payload queue. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm Purge", style: "destructive", onPress: () => {
            setBufferSize(0.0);
            Alert.alert("Buffer Purged", "Local telemetry queue buffer has been cleared (0.0 GB).");
        }}
      ]
    );
  };

  const handleInspectAuth = () => {
    Alert.alert(
      "Auth Protocol Clearance",
      `Clearance level: Level 4 Encryption.\nNode Status: ${authStatus}.\nAction: Tap below to toggle secure routing or bypass authorization rules.`,
      [
        { text: authStatus === 'SECURE' ? "Toggle Bypass Mode" : "Toggle Secure Mode", onPress: () => {
            setAuthStatus(authStatus === 'SECURE' ? 'BYPASS' : 'SECURE');
        }},
        { text: "Diagnostics OK", style: "cancel" }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Operative Profile Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <NxText variant="mono" color={colors.gold} style={styles.hudTag}>
            OPERATIVE PROFILE
          </NxText>
          <NxText variant="h2" style={styles.title}>
            {user?.email ? user.email.split('@')[0].toUpperCase() : 'OPERATIVE'}
          </NxText>
          <NxText variant="caption" color={colors.text2} style={styles.emailText}>
            {user?.email ?? 'Not logged in'}
          </NxText>
          <NxText variant="caption" color={colors.green} style={styles.subTag}>
            • {cityName} Node · {syncActive ? 'Secure Connection' : 'Offline Queue Buffer'}
          </NxText>
        </View>
        <View style={styles.rankCard}>
          <NxText variant="mono" color={colors.gold} style={styles.rankLabel}>TRUST RANK</NxText>
          <NxText variant="h3" color={colors.gold} style={styles.rankVal}>A++</NxText>
        </View>
      </View>

      {/* Completed Repairs Card */}
      <View style={styles.cardGroup}>
        <NxCard style={styles.metricCard}>
          <NxText variant="mono" color={colors.gold} style={styles.metricLabel}>
            TOTAL COMPLETED REPAIRS
          </NxText>
          <View style={styles.metricValRow}>
            <NxText variant="h1" color={colors.gold} style={styles.metricVal}>
              {completedRepairs < 10 ? `0${completedRepairs}` : completedRepairs}
            </NxText>
            <NxText variant="caption" color={colors.green} style={styles.metricSub}>
              +0 this week
            </NxText>
          </View>
        </NxCard>

        {/* Assigned Sectors & Uptime Row */}
        <View style={styles.sectorsGrid}>
          <View style={styles.sectorBox}>
            <NxText variant="mono" style={styles.sectorLabel}>ASSIGNED SECTOR</NxText>
            <NxText variant="h3" color={colors.text} style={styles.sectorVal}>
              {cityName.toUpperCase()}
            </NxText>
            <NxText variant="caption" color={colors.text2} style={styles.sectorDesc}>
              {activeWard.toUpperCase()}
            </NxText>
          </View>
          <View style={[styles.sectorBox, styles.lastSectorBox]}>
            <NxText variant="mono" style={styles.sectorLabel}>UPTIME</NxText>
            <NxText variant="h3" color={syncActive ? colors.green : colors.orange} style={styles.sectorVal}>
              {syncActive ? '99.9%' : '94.2%'}
            </NxText>
            <NxText variant="caption" color={colors.text2} style={styles.sectorDesc}>
              {syncActive ? 'Optimal' : 'Offline Queue'}
            </NxText>
          </View>
        </View>
      </View>

      {/* Telemetry Sync Parameters */}
      <View style={styles.cardGroup}>
        <NxText variant="mono" color={colors.teal} style={styles.telemetryHeading}>
          TELEMETRY SYNC PARAMETERS
        </NxText>

        {/* Parameter Item: Neural Link */}
        <View style={styles.paramItem}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <NxText variant="body" color={colors.text} style={styles.paramName}>Neural Link</NxText>
            <NxText variant="caption" color={colors.text2}>
              Status: {syncActive ? "Syncing..." : "Queueing Offline Payload"}
            </NxText>
            <NxText variant="caption" color={colors.text3} style={styles.paramDesc}>
              Establishes a direct real-time uplink to the central Supabase server node. If deactivated, civic updates are buffered locally in the device queue.
            </NxText>
          </View>
          <Switch
            value={syncActive}
            onValueChange={setSyncActive}
            trackColor={{ false: colors.text3, true: colors.gold }}
            thumbColor={syncActive ? '#fff' : colors.text3}
          />
        </View>

        {/* Parameter Item: Local Buffer */}
        <TouchableOpacity style={styles.paramItem} onPress={handlePurgeBuffer}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <NxText variant="body" color={colors.text} style={styles.paramName}>Local Storage Buffer</NxText>
            <NxText variant="caption" color={colors.text2}>{bufferSize.toFixed(1)} GB / 128 GB allocated</NxText>
            <NxText variant="caption" color={colors.text3} style={styles.paramDesc}>
              Simulates local cache size of queued civic payloads. Purging will delete locally stored offline queue.
            </NxText>
          </View>
          <NxText variant="mono" color={bufferSize > 0 ? colors.teal : colors.text3} style={styles.paramVal}>
            {bufferSize > 0 ? 'ACTIVE' : 'PURGED'}
          </NxText>
        </TouchableOpacity>

        {/* Parameter Item: Auth Protocol */}
        <TouchableOpacity style={styles.paramItem} onPress={handleInspectAuth}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <NxText variant="body" color={colors.text} style={styles.paramName}>Auth Protocol</NxText>
            <NxText variant="caption" color={colors.text2}>Level 4 Encryption Clearance</NxText>
            <NxText variant="caption" color={colors.text3} style={styles.paramDesc}>
              Toggle security encryption clearance level. Bypass mode disables standard Auth checks for instant terminal logging.
            </NxText>
          </View>
          <NxText variant="mono" color={authStatus === 'SECURE' ? colors.gold : colors.orange} style={styles.paramVal}>
            {authStatus}
          </NxText>
        </TouchableOpacity>

        {/* Tap 5 times on this row to toggle Developer role switcher */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleUserIdTap} style={styles.userIdCard}>
          <View style={styles.userIdRow}>
            <View>
              <NxText variant="caption" style={styles.userIdLabel}>System Diagnostics ID</NxText>
              <NxText variant="mono" color={colors.text2} style={styles.userIdVal}>
                {user?.id ? `#${user.id.toUpperCase().slice(0, 16)}` : '-'}
              </NxText>
            </View>
            <NxText variant="caption" color={colors.gold}>→</NxText>
          </View>
        </TouchableOpacity>

        {/* Render role switcher only if devMode is active */}
        <View style={styles.devContainer}>
            <NxText variant="caption" style={styles.devLabel}>[Developer Terminal] Force Bypass Role</NxText>
            <View style={styles.devRow}>
              <TouchableOpacity
                onPress={() => setRole('citizen')}
                style={[styles.roleBtn, role === 'citizen' && styles.roleActive]}
              >
                <NxText variant="caption" color={role === 'citizen' ? colors.purple : colors.text3} style={styles.roleBtnText}>
                  Citizen View
                </NxText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRole('agent')}
                style={[styles.roleBtn, role === 'agent' && styles.roleActive]}
              >
                <NxText variant="caption" color={role === 'agent' ? colors.purple : colors.text3} style={styles.roleBtnText}>
                  Agent View
                </NxText>
              </TouchableOpacity>
            </View>
          </View>
        
      </View>

      {/* Support & Legal Terminal Section */}
      <View style={styles.cardGroup}>
        <NxText variant="mono" color={colors.gold} style={styles.telemetryHeading}>
          SUPPORT & LEGAL TERMINAL
        </NxText>

        <TouchableOpacity style={styles.paramItem} onPress={() => setTermsVisible(true)}>
          <View>
            <NxText variant="body" color={colors.text} style={styles.paramName}>Terms & Conditions</NxText>
            <NxText variant="caption" color={colors.text2}>Operation guidelines and user agreement</NxText>
          </View>
          <NxText variant="caption" color={colors.gold}>→</NxText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paramItem}
          onPress={() => {
            Alert.alert(
              "Report an Issue",
              "To report an app bug or system issue, please email our developer support team at support@nexora.gov.in with details."
            );
          }}
        >
          <View>
            <NxText variant="body" color={colors.text} style={styles.paramName}>Report an Issue / Feedback</NxText>
            <NxText variant="caption" color={colors.text2}>Submit bug reports and developer logs</NxText>
          </View>
          <NxText variant="caption" color={colors.gold}>→</NxText>
        </TouchableOpacity>
      </View>

      <View style={styles.cardGroup}>
        <NxText variant="caption" style={styles.sectionLabel}>Active Operation City</NxText>
        <CitySwitcherSheet />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <NxText variant="label" color={colors.text} style={styles.logoutText}>
            🚪 Logout Terminal
          </NxText>
        </TouchableOpacity>

        <NxButton
          label="Delete Account"
          onPress={async () => {
            Alert.alert(
              "Delete Account",
              "Are you sure you want to delete this operative account from the grid? This action is permanent.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: async () => await signOut() }
              ]
            );
          }}
          variant="ghost"
          textColor={colors.red}
          style={styles.deleteBtn}
        />

        <View style={styles.footerTag}>
          <NxText variant="mono" color={colors.text3} style={styles.footerText}>
            Nexus OS v4.2.0-stable
          </NxText>
          <NxText variant="mono" color={colors.text3} style={styles.footerText}>
            Build ID: NEX-724-AX-99
          </NxText>
        </View>
      </View>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={termsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <NxText variant="h3">Terms & Conditions</NxText>
              <TouchableOpacity onPress={() => setTermsVisible(false)} style={styles.modalClose}>
                <NxText variant="body" color={colors.text3}>✕</NxText>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.termsScroll}>
              <NxText variant="body" color={colors.text} style={styles.termsText}>
                Welcome to the Nexora Civic Command Network. By accessing this terminal, you agree to comply with local municipality data collection protocols and operative guidelines.
                {"\n\n"}
                1. Data Privacy: All telemetry inputs (photos, geolocation coordinates, district categorization) are logged securely in the municipality database for grievance redressal purposes.
                {"\n\n"}
                2. User Conduct: Operatives are responsible for filing accurate incident reports. False logging or simulation spamming will result in terminal access suspension.
                {"\n\n"}
                3. Operations: Real-time telemetry routing depends on local grid availability. Offline submissions will queue locally on-device and sync automatically when internet connectivity is re-established.
              </NxText>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  content:      { padding: spacing.xl, paddingBottom: 60 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerTitleBox: { flex: 1 },
  hudTag:       { fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  title:        { marginTop: spacing.xs, fontWeight: '800' },
  emailText:    { fontSize: 12, marginTop: spacing.xs, fontWeight: '500' },
  subTag:       { fontSize: 11, fontWeight: '600', marginTop: spacing.xs },
  rankCard:     {
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  rankLabel:    { fontSize: 8, letterSpacing: 1 },
  rankVal:      { fontSize: 14, fontWeight: 'bold', marginTop: 2 },

  cardGroup:    {
    backgroundColor: 'rgba(25, 25, 35, 0.45)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  // Metric Completed Repairs
  metricCard:   {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  metricLabel:  { fontSize: 8, letterSpacing: 1.5, fontWeight: 'bold' },
  metricValRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.sm },
  metricVal:    { fontSize: 28, fontWeight: 'bold', lineHeight: 32 },
  metricSub:    { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },

  // Sectors Grid
  sectorsGrid:  { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  sectorBox:    {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm + 2,
  },
  lastSectorBox: { marginRight: 0 },
  sectorLabel:  { fontSize: 8, color: colors.text2, letterSpacing: 1 },
  sectorVal:    { fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  sectorDesc:   { fontSize: 9, marginTop: 2 },

  // Telemetry Parameter Items
  telemetryHeading: { fontSize: 8, letterSpacing: 1.5, fontWeight: 'bold', marginBottom: spacing.md },
  paramItem:    {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  paramName:    { fontWeight: '700', fontSize: 12 },
  paramVal:     { fontSize: 10, fontWeight: 'bold' },
  paramDesc:    { fontSize: 10, color: colors.text3, marginTop: 4, lineHeight: 14 },

  // Diagnostics ID
  userIdCard:   {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderColor: colors.border2,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  userIdRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userIdLabel:  { fontSize: 8, color: colors.text2, letterSpacing: 1, fontWeight: 'bold' },
  userIdVal:    { fontSize: 10, marginTop: 4, fontWeight: 'bold' },

  // Developer mode
  devContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border2,
    paddingTop: spacing.md,
  },
  devLabel:     { color: colors.gold, fontWeight: 'bold', letterSpacing: 0.5, fontSize: 9 },
  devRow:       { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  roleBtn:      {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border2,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 6,
  },
  roleBtnText:  { fontWeight: '700', fontSize: 11 },
  roleActive:   { borderColor: colors.purple, backgroundColor: 'rgba(155,95,224,0.08)' },

  sectionLabel: { marginBottom: spacing.md, color: colors.text2, letterSpacing: 0.5, fontSize: 9 },
  actions:      { marginTop: spacing.md },
  logoutBtn:    {
    backgroundColor: colors.red,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  logoutText:   { fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  deleteBtn:    { marginTop: spacing.xs },
  footerTag:    { marginTop: spacing.xl, alignItems: 'center', gap: 2 },
  footerText:   { fontSize: 9, opacity: 0.8 },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    padding: spacing.lg,
    borderColor: colors.border,
    borderTopWidth: 1,
  },
  modalHeader:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalClose:   { padding: spacing.sm },
  termsScroll:  { paddingBottom: spacing.lg },
  termsText:    { lineHeight: 20 },
});
