import React, { useState, useEffect } from 'react';
import {
  View, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, Modal
} from 'react-native';
import { NxText } from '../components/ui/NxText';
import { NxCard } from '../components/ui/NxCard';
import { colors, spacing, statusColors } from '../theme/tokens';
import { useRealtimeComplaints } from '../hooks/useRealtimeComplaints';
import { Complaint } from '../lib/complaints';
import { SmartCityAgentScreen } from './SmartCityAgentScreen';
import { ResolveScreen } from './ResolveScreen';
import { useCityStore } from '../stores/cityStore';
import { useAuthStore } from '../stores/authStore';
import { offlineQueue } from '../lib/offlineQueue';

export function DashboardScreen() {
  const { activeCity } = useCityStore();
  const { user } = useAuthStore();
  const { complaints, loading } = useRealtimeComplaints(activeCity.toLowerCase());
  const [agentOpen, setAgentOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    const checkQueue = async () => {
      const q = await offlineQueue.getAll();
      setQueuedCount(q.length);
    };
    checkQueue();
  }, [complaints]);

  const getStatusLabel = (status: string = 'submitted') => {
    const labels: Record<string, string> = {
      submitted: 'SUBMITTED',
      verified: 'VERIFIED',
      assigned: 'ASSIGNED',
      in_progress: 'IN PROGRESS',
      resolved: 'RESOLVED',
      closed: 'CLOSED',
    };
    return labels[status.toLowerCase()] || status.toUpperCase();
  };

  const assignedCount = complaints.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const syncingCount = complaints.filter(c => c.status === 'submitted' || c.status === 'verified').length + queuedCount;

  const renderItem = ({ item }: { item: Complaint }) => (
    <NxCard style={styles.card}>
      <View style={styles.cardHeader}>
        <NxText variant="h3">{item.title}</NxText>
        <View style={[styles.badge, { borderColor: statusColors[item.status ?? 'submitted'] }]}>
          <NxText variant="mono" color={statusColors[item.status ?? 'submitted']}>
            {getStatusLabel(item.status)}
          </NxText>
        </View>
      </View>
      <NxText variant="caption" style={styles.category}>{item.category} · Ward: {item.ward || 'General'}</NxText>
      <NxText variant="body" style={styles.desc} numberOfLines={2}>
        {item.description}
      </NxText>
      <View style={styles.cardFooter}>
        <NxText variant="caption" color={colors.text2}>{item.city.toUpperCase()}</NxText>
        <NxText variant="caption" color={colors.text2}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
        </NxText>
      </View>

      {/* Action Bar */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.aiBtn}
          onPress={() => { setSelectedComplaint(item); setAgentOpen(true); }}
        >
          <NxText variant="mono" color={colors.teal} style={styles.actionBtnText}>🤖 Ask AI</NxText>
        </TouchableOpacity>

        {item.status !== 'resolved' && (
          <TouchableOpacity
            style={styles.resolveBtn}
            onPress={() => { setSelectedComplaint(item); setResolveOpen(true); }}
          >
            <NxText variant="mono" color={colors.purple} style={styles.actionBtnText}>🔧 Resolve</NxText>
          </TouchableOpacity>
        )}
      </View>
    </NxCard>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const username = user?.email ? user.email.split('@')[0].toUpperCase() : 'OPERATIVE';

  return (
    <View style={styles.container}>
      {/* Figma Command Dashboard Header */}
      <View style={styles.header}>
        <NxText variant="mono" color={colors.gold} style={styles.hudTag}>
          COMMAND AUTHORIZATION ACTIVE
        </NxText>
        <NxText variant="h2" style={styles.title}>
          Welcome, {username}
        </NxText>
        <NxText variant="caption" color={colors.green} style={styles.subTag}>
          • Sector 4 Command · Active Duty
        </NxText>

        {/* Telemetry Stats Grid */}
        <View style={styles.telemetryGrid}>
          <View style={styles.telemetryBox}>
            <NxText variant="mono" style={styles.telemetryLabel}>ASSIGNED</NxText>
            <NxText variant="h3" color={colors.gold} style={styles.telemetryVal}>
              {assignedCount < 10 ? `0${assignedCount}` : assignedCount} active
            </NxText>
          </View>
          <View style={styles.telemetryBox}>
            <NxText variant="mono" style={styles.telemetryLabel}>RESOLVED</NxText>
            <NxText variant="h3" color={colors.green} style={styles.telemetryVal}>
              {resolvedCount < 10 ? `0${resolvedCount}` : resolvedCount} resolved
            </NxText>
          </View>
          <View style={[styles.telemetryBox, styles.lastTelemetryBox]}>
            <NxText variant="mono" style={styles.telemetryLabel}>SYNCING</NxText>
            <NxText variant="h3" color={colors.orange} style={styles.telemetryVal}>
              {syncingCount < 10 ? `0${syncingCount}` : syncingCount} alerts
            </NxText>
          </View>
        </View>

        {/* Neural Network mapping description card */}
        <View style={styles.neuralMapCard}>
          <NxText variant="mono" color={colors.teal} style={styles.neuralHeading}>
            NEURAL NETWORK MAPPING
          </NxText>
          <NxText variant="caption" color={colors.text2} style={styles.neuralText}>
            Real-time urban intelligence processing across Sector 4.
          </NxText>
        </View>

        <NxText variant="mono" color={colors.text3} style={styles.nodeActive}>
          • NODE_42: ACTIVE
        </NxText>
      </View>

      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id ?? Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <NxText variant="body">No active complaints found</NxText>
          </View>
        }
      />



      {/* AI Agent Modal */}
      <Modal
        visible={agentOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAgentOpen(false)}
      >
        <SmartCityAgentScreen
          onClose={() => setAgentOpen(false)}
          complaint={selectedComplaint}
        />
      </Modal>

      {/* Resolve Screen Modal */}
      <Modal
        visible={resolveOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setResolveOpen(false)}
      >
        <ResolveScreen
          route={{ params: { complaint: selectedComplaint } }}
          onClose={() => setResolveOpen(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  center:     { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header:     { padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  hudTag:     { fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  title:      { marginTop: spacing.xs, fontWeight: '800' },
  subTag:     { fontSize: 11, fontWeight: '600', marginTop: spacing.xs },

  // Metrics Grid
  telemetryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  telemetryBox:  {
    flex: 1,
    backgroundColor: 'rgba(25, 25, 35, 0.45)',
    borderColor: colors.border2,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm + 2,
  },
  lastTelemetryBox: {
    marginRight: 0,
  },
  telemetryLabel: { fontSize: 8, color: colors.text2, letterSpacing: 1 },
  telemetryVal:   { fontSize: 12, fontWeight: 'bold', marginTop: 4 },

  // Neural Map Card
  neuralMapCard: {
    backgroundColor: 'rgba(76, 201, 192, 0.04)',
    borderColor: 'rgba(76, 201, 192, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  neuralHeading: { fontSize: 9, letterSpacing: 1.5, fontWeight: 'bold' },
  neuralText:    { fontSize: 11, marginTop: 4, lineHeight: 16 },

  nodeActive:    { fontSize: 9, letterSpacing: 1, marginTop: spacing.md },

  list:       { padding: spacing.md, gap: 8, paddingBottom: 100 },
  card:       {
    marginBottom: 4,
    backgroundColor: 'rgba(25, 25, 35, 0.45)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  badge:      { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  category:   { marginBottom: spacing.sm, color: colors.gold, fontWeight: '600' },
  desc:       { marginBottom: spacing.sm, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: spacing.xs },
  aiBtn:      {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 192, 0.3)',
    backgroundColor: 'rgba(76, 201, 192, 0.06)',
    alignItems: 'center',
    borderRadius: 6,
  },
  resolveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(155, 95, 224, 0.3)',
    backgroundColor: 'rgba(155, 95, 224, 0.06)',
    alignItems: 'center',
    borderRadius: 6,
  },
  actionBtnText: { fontWeight: '700', fontSize: 11 },
  fab:        {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.teal,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText:    { fontSize: 24 },
});