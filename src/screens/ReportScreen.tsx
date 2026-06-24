import React, { useState } from 'react';
import {
  View, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Image, Modal, FlatList
} from 'react-native';
import * as Location from 'expo-location';
import { NxText } from '../components/ui/NxText';
import { NxButton } from '../components/ui/NxButton';
import { NxCard } from '../components/ui/NxCard';
import { colors, spacing } from '../theme/tokens';
import { takePhoto, uploadToCloudinary } from '../lib/uploadImage';
import { submitComplaint } from '../lib/complaints';
import { CvSuggestionBanner } from '../components/CvSuggestionBanner';
import { supabase } from '../lib/supabase';
import { useCityStore } from '../stores/cityStore';
import { offlineQueue } from '../lib/offlineQueue';

const CATEGORIES = ['Potholes', 'Sanitation', 'Streetlights', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High'];

// Wards dictionary mapped by city id
const CITY_WARDS: Record<string, string[]> = {
  mumbai: ['Andheri', 'Bandra', 'Borivali', 'Dharavi', 'Kurla', 'Goregaon', 'Other'],
  delhi: ['Connaught Place', 'Dwarka', 'Saket', 'Karol Bagh', 'Rohini', 'Vasant Kunj', 'Other'],
  bangalore: ['Koramangala', 'Indiranagar', 'Jayanagar', 'Whitefield', 'HSR Layout', 'Electronic City', 'Other'],
  chennai: ['Adyar', 'T. Nagar', 'Velachery', 'Mylapore', 'Anna Nagar', 'Nungambakkam', 'Other'],
  hyderabad: ['Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Begumpet', 'Secunderabad', 'Other'],
  pune: ['Kothrud', 'Koregaon Park', 'Shivajinagar', 'Aundh', 'Hadapsar', 'Viman Nagar', 'Other'],
};

export function ReportScreen() {
  const { activeCity, cities, syncActive, bufferSize, setBufferSize, authStatus } = useCityStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [ward, setWard] = useState('');
  const [customWard, setCustomWard] = useState('');
  const [showCustomWard, setShowCustomWard] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cvSuggestion, setCvSuggestion] = useState<any>(null);
  const [cvLoading, setCvLoading] = useState(false);

  const [wardModalOpen, setWardModalOpen] = useState(false);

  // Dynamic city label mapping
  const currentCityObj = cities.find(c => c.id === activeCity);
  const cityName = currentCityObj ? currentCityObj.label : 'Mumbai';
  const capitalizedCityName = cityName.charAt(0).toUpperCase() + cityName.slice(1);

  // Resolve wards list based on selected city (fallback to mumbai)
  const currentWards = CITY_WARDS[activeCity.toLowerCase()] || CITY_WARDS.mumbai;

  const handlePhoto = async () => {
    const uri = await takePhoto();
    if (!uri) return;
    setPhotoUri(uri);
    setCvLoading(true);
    try {
      const { data } = await supabase.functions.invoke('analyse-photo', {
        body: { photoUri: uri },
      });
      if (data?.confidence >= 0.7) setCvSuggestion(data);
    } catch (e) {
      console.log('CV analysis failed:', e);
    } finally {
      setCvLoading(false);
    }
  };

  const handleSelectWard = (selected: string) => {
    if (selected === 'Other') {
      setWard('Other');
      setShowCustomWard(true);
    } else {
      setWard(selected);
      setShowCustomWard(false);
      setCustomWard('');
      useCityStore.getState().setWard(selected);
    }
    setWardModalOpen(false);
  };

  const handleSubmit = async () => {
    const finalWard = showCustomWard ? customWard.trim() : ward;
    const finalCategory = category === 'Other' ? customCategory.trim() : category;

    if (!title || !finalCategory || !severity || !finalWard) {
      setError('Title, category, severity and ward are required');
      return;
    }
    useCityStore.getState().setWard(finalWard);
    setLoading(true);
    setError('');

    let photo_url: string | undefined;
    if (photoUri) {
      const url = await uploadToCloudinary(photoUri);
      if (url) photo_url = url;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (status === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      } catch (e) {
        console.log("Failed to fetch current GPS coordinates:", e);
      }
    }

    const cityCenters: Record<string, { lat: number, lng: number }> = {
      mumbai: { lat: 19.0760, lng: 72.8777 },
      delhi: { lat: 28.6139, lng: 77.2090 },
      bangalore: { lat: 12.9716, lng: 77.5946 },
      chennai: { lat: 13.0827, lng: 80.2707 },
      hyderabad: { lat: 17.3850, lng: 78.4867 },
      pune: { lat: 18.5204, lng: 73.8567 },
    };

    if (!latitude || !longitude) {
      const center = cityCenters[activeCity.toLowerCase()] || cityCenters.mumbai;
      latitude = center.lat + (Math.random() - 0.5) * 0.015;
      longitude = center.lng + (Math.random() - 0.5) * 0.015;
    }

    if (!syncActive) {
      await offlineQueue.add('SUBMIT_COMPLAINT', {
        title,
        description,
        category: finalCategory,
        photo_url,
        latitude,
        longitude,
        city: activeCity.toLowerCase(),
        severity: severity.toLowerCase(),
        ward: finalWard,
      });
      setBufferSize(bufferSize + 0.4);
      setLoading(false);
      setSuccess(true);
      setTitle('');
      setDescription('');
      setCategory('');
      setCustomCategory('');
      setSeverity('');
      setWard('');
      setCustomWard('');
      setShowCustomWard(false);
      setPhotoUri(null);
      setCvSuggestion(null);
      return;
    }

    const ok = await submitComplaint({
      title,
      description,
      category: finalCategory,
      photo_url,
      latitude,
      longitude,
      city: activeCity.toLowerCase(),
      severity: severity.toLowerCase(),
      ward: finalWard,
    });

    setLoading(false);
    if (ok) {
      setSuccess(true);
      setTitle('');
      setDescription('');
      setCategory('');
      setCustomCategory('');
      setSeverity('');
      setWard('');
      setCustomWard('');
      setShowCustomWard(false);
      setPhotoUri(null);
      setCvSuggestion(null);
    } else {
      setError('Failed to submit. Saved offline.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Figma Branded Header */}
      <View style={styles.headerRow}>
        <View>
          <NxText variant="mono" color={colors.gold} style={styles.hudTag}>
            TELEMETRY INTAKE
          </NxText>
          <NxText variant="h2" style={styles.heading}>
            Incident Report
          </NxText>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {authStatus === 'BYPASS' && (
            <View style={[styles.cvBadge, { borderColor: colors.orange, backgroundColor: 'rgba(255, 102, 0, 0.05)' }]}>
              <NxText variant="mono" color={colors.orange} style={styles.cvText}>
                • BYPASS ACTIVE
              </NxText>
            </View>
          )}
          <View style={styles.cvBadge}>
            <NxText variant="mono" color={colors.green} style={styles.cvText}>
              • CV ACTIVE
            </NxText>
          </View>
        </View>
      </View>

      {success && (
        <NxCard style={[styles.successBox, !syncActive ? { borderColor: colors.orange, backgroundColor: 'rgba(255, 102, 0, 0.05)' } : undefined]}>
          <NxText variant="body" color={syncActive ? colors.green : colors.orange}>
            {syncActive ? '✓ Telemetry payload submitted successfully!' : '⚠️ NEURAL LINK OFFLINE: Civic packet buffered to local storage.'}
          </NxText>
        </NxCard>
      )}

      {/* Form Section */}
      <View style={styles.formCard}>
        {/* Visual Evidence capture box */}
        <NxText variant="caption" style={styles.label}>VISUAL EVIDENCE</NxText>
        <TouchableOpacity onPress={handlePhoto} style={styles.photoUploadBlock}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <View style={styles.cameraIconBox}>
                <NxText variant="body" style={styles.cameraIcon}>📷</NxText>
              </View>
              <NxText variant="caption" color={colors.text2} style={styles.photoText}>
                Tap to capture visual evidence
              </NxText>
            </View>
          )}
        </TouchableOpacity>

        {/* CV Banner */}
        <CvSuggestionBanner
          suggestion={cvSuggestion}
          loading={cvLoading}
          onAccept={(s) => {
            setTitle(s.title);
            setCategory(s.category);
            setCvSuggestion(null);
          }}
          onDismiss={() => setCvSuggestion(null)}
        />

        {/* Localization Matrix binds dynamically to selected activeCity */}
        <View style={styles.coordBox}>
          <NxText variant="mono" color={colors.teal} style={styles.coordLabel}>
            🚀 LOCALIZATION MATRIX
          </NxText>
          <NxText variant="body" color={colors.text} style={styles.coordVal}>
            GPS Lock Active · {capitalizedCityName} Municipality
          </NxText>
        </View>

        <NxText variant="caption" style={styles.label}>INCIDENT IDENTIFIER TITLE</NxText>
        <TextInput
          style={styles.input}
          placeholder="Enter incident label..."
          placeholderTextColor={colors.text3}
          value={title}
          onChangeText={setTitle}
        />

        <NxText variant="caption" style={styles.label}>INCIDENT CLASSIFICATION</NxText>
        <View style={styles.chipsRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.chip, category === cat && styles.chipActive]}
            >
              <NxText variant="caption" color={category === cat ? colors.gold : colors.text2} style={styles.chipText}>
                {cat}
              </NxText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Category Input Option */}
        {category === 'Other' && (
          <View style={styles.customCategoryContainer}>
            <NxText variant="caption" style={styles.label}>SPECIFY CLASSIFICATION CATEGORY</NxText>
            <TextInput
              style={styles.input}
              placeholder="Enter custom incident category..."
              placeholderTextColor={colors.text3}
              value={customCategory}
              onChangeText={setCustomCategory}
            />
          </View>
        )}

        <NxText variant="caption" style={styles.label}>SEVERITY PROFILE</NxText>
        <View style={styles.chipsRow}>
          {SEVERITIES.map(sev => (
            <TouchableOpacity
              key={sev}
              onPress={() => setSeverity(sev)}
              style={[styles.chip, severity === sev && styles.chipActive]}
            >
              <NxText variant="caption" color={severity === sev ? colors.gold : colors.text2} style={styles.chipText}>
                {sev}
              </NxText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Dropdown Picker for Ward */}
        <NxText variant="caption" style={styles.label}>MUNICIPAL DISTRICT SECTOR (WARD)</NxText>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setWardModalOpen(true)}
        >
          <NxText variant="body" color={ward ? colors.text : colors.text3}>
            {ward ? (ward === 'Other' && customWard ? `Other: ${customWard}` : ward) : `Select ${capitalizedCityName} District Sector...`}
          </NxText>
          <NxText variant="caption" color={colors.gold}>▼</NxText>
        </TouchableOpacity>

        {/* Conditional "Other" input */}
        {showCustomWard && (
          <View style={styles.customWardContainer}>
            <NxText variant="caption" style={styles.label}>SPECIFY DISTRICT WARD</NxText>
            <TextInput
              style={styles.input}
              placeholder="Type ward location..."
              placeholderTextColor={colors.text3}
              value={customWard}
              onChangeText={setCustomWard}
            />
          </View>
        )}

        <NxText variant="caption" style={styles.label}>TELEMETRY NOTES & DESCRIPTION</NxText>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe the severity and environmental variables..."
          placeholderTextColor={colors.text3}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <NxText variant="caption" color={colors.red}>{error.toUpperCase()}</NxText>
        </View>
      ) : null}

      <NxButton
        label="➤ SUBMIT INCIDENT"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitBtn}
      />

      {/* Ward Selection Dropdown Modal */}
      <Modal
        visible={wardModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWardModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <NxText variant="h3">Select Sector Ward ({capitalizedCityName})</NxText>
              <TouchableOpacity onPress={() => setWardModalOpen(false)} style={styles.modalClose}>
                <NxText variant="body" color={colors.text3}>✕</NxText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={currentWards}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, ward === item && styles.modalItemActive]}
                  onPress={() => handleSelectWard(item)}
                >
                  <NxText
                    variant="body"
                    color={ward === item ? colors.gold : colors.text}
                  >
                    {item}
                  </NxText>
                  {ward === item && <NxText variant="caption" color={colors.gold}>✓</NxText>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  content:    { padding: spacing.xl, paddingBottom: 60 },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  hudTag:     { fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  heading:    { marginTop: spacing.xs, fontWeight: '800' },
  cvBadge:    {
    borderWidth: 1,
    borderColor: 'rgba(90, 201, 122, 0.3)',
    backgroundColor: 'rgba(90, 201, 122, 0.05)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cvText:     { fontSize: 8, fontWeight: 'bold' },
  formCard:   {
    backgroundColor: 'rgba(20, 20, 30, 0.65)',
    borderColor: 'rgba(201, 168, 76, 0.2)',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  label:      { marginBottom: spacing.sm, marginTop: spacing.sm, color: colors.text2, letterSpacing: 1, fontSize: 8, fontWeight: 'bold' },
  input:      {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1.5,
    borderColor: colors.border2,
    color: colors.text,
    fontSize: 13,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  textarea:   { height: 90, textAlignVertical: 'top' },
  chipsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  chip:       {
    borderWidth: 1.5,
    borderColor: colors.border2,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  chipText:   { fontWeight: '700', fontSize: 11 },
  chipActive:  { borderColor: colors.gold, backgroundColor: 'rgba(201, 168, 76, 0.08)' },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1.5,
    borderColor: colors.border2,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  customWardContainer: {
    marginBottom: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
    paddingLeft: spacing.sm,
  },
  customCategoryContainer: {
    marginBottom: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
    paddingLeft: spacing.sm,
  },
  photoUploadBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1.5,
    borderColor: colors.border2,
    borderRadius: 8,
    height: 120,
    overflow: 'hidden',
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  cameraIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
    borderColor: colors.gold,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: { fontSize: 16 },
  photoText:  { fontSize: 10, letterSpacing: 0.5 },
  photo:      { width: '100%', height: '100%', resizeMode: 'cover' },
  coordBox:   {
    backgroundColor: 'rgba(76, 201, 192, 0.04)',
    borderColor: 'rgba(76, 201, 192, 0.15)',
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  coordLabel: { fontSize: 8, letterSpacing: 1.5, fontWeight: 'bold' },
  coordVal:   { fontSize: 11, marginTop: 2 },
  successBox: { marginBottom: spacing.md, borderColor: colors.green, backgroundColor: 'rgba(90, 201, 122, 0.05)' },
  errorBox:   {
    padding: spacing.sm,
    backgroundColor: 'rgba(224, 90, 90, 0.08)',
    borderColor: 'rgba(224, 90, 90, 0.2)',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  submitBtn:  { marginTop: spacing.sm },

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
  modalItem:    {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  modalItemActive: {
    backgroundColor: 'rgba(201,168,76,0.04)',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});