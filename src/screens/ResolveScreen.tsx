import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { NxText } from '../components/ui/NxText';
import { NxButton } from '../components/ui/NxButton';
import { NxCard } from '../components/ui/NxCard';
import { BeforeAfterPair } from '../components/BeforeAfterPair';
import { colors, spacing } from '../theme/tokens';
import { takePhoto, uploadToCloudinary } from '../lib/uploadImage';
import { supabase } from '../lib/supabase';

interface ResolveScreenProps {
  route?: any;
  onClose?: () => void;
}

export function ResolveScreen({ route, onClose }: ResolveScreenProps) {
  const complaint = route?.params?.complaint;
  const [afterUri, setAfterUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleTakeAfter = async () => {
    const uri = await takePhoto();
    if (uri) setAfterUri(uri);
  };

  const handleResolve = async () => {
    if (!afterUri) {
      setError('Please take an after photo first');
      return;
    }
    setLoading(true);
    setError('');

    const afterUrl = await uploadToCloudinary(afterUri);

    const { error: err } = await supabase
      .from('complaints')
      .update({
        after_photo_url: afterUrl,
        status: 'resolved',
      })
      .eq('id', complaint?.id);

    setLoading(false);
    if (err) {
      setError('Failed to resolve complaint');
    } else {
      setSuccess(true);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTitleBox}>
          <NxText variant="mono" color={colors.purple}>RESOLVE COMPLAINT</NxText>
          <NxText variant="h2" style={styles.title}>
            {complaint?.title ?? 'Incident Details'}
          </NxText>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <NxText variant="body" color={colors.text3}>✕</NxText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardGroup}>
        <NxCard style={styles.card}>
          <NxText variant="caption" color={colors.gold}>{complaint?.category}</NxText>
          <NxText variant="body" style={styles.desc}>
            {complaint?.description ?? 'No description provided.'}
          </NxText>
        </NxCard>

        <NxText variant="caption" style={styles.label}>Resolution Evidence (Before / After)</NxText>
        <BeforeAfterPair
          beforeUri={complaint?.photo_url}
          afterUri={afterUri ?? undefined}
          onTakeAfter={handleTakeAfter}
        />
      </View>

      {success ? (
        <NxCard style={styles.successBox}>
          <NxText variant="body" color={colors.green}>✓ Incident resolved and updated in Supabase successfully!</NxText>
        </NxCard>
      ) : (
        <NxButton
          label="Mark as Resolved"
          onPress={handleResolve}
          loading={loading}
          disabled={!afterUri}
          style={styles.btn}
        />
      )}

      {error ? (
        <View style={styles.errorBox}>
          <NxText variant="caption" color={colors.red} style={styles.error}>
            {error}
          </NxText>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  content:    { padding: spacing.xl, paddingBottom: 60 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  headerTitleBox: { flex: 1 },
  title:      { marginTop: spacing.sm },
  closeBtn:   { padding: spacing.sm },
  cardGroup:  {
    backgroundColor: 'rgba(25, 25, 35, 0.45)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  card:       {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  desc:       { marginTop: spacing.xs },
  label:      { marginBottom: spacing.sm, marginTop: spacing.md, color: colors.text2, letterSpacing: 0.5 },
  btn:        { marginTop: spacing.sm },
  successBox: { borderColor: colors.green, backgroundColor: 'rgba(90, 201, 122, 0.05)', marginTop: spacing.sm },
  errorBox:   {
    padding: spacing.sm,
    backgroundColor: 'rgba(224, 90, 90, 0.08)',
    borderColor: 'rgba(224, 90, 90, 0.2)',
    borderWidth: 1,
    borderRadius: 6,
    marginTop: spacing.md,
  },
  error:      { textAlign: 'center' },
});
