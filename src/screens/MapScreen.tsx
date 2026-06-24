import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { NxText } from '../components/ui/NxText';
import { colors, statusColors } from '../theme/tokens';
import { Complaint } from '../lib/complaints';
import { useCityStore } from '../stores/cityStore';
import { useRealtimeComplaints } from '../hooks/useRealtimeComplaints';

export function MapScreen() {
  const { activeCity } = useCityStore();
  const { complaints, loading } = useRealtimeComplaints(activeCity.toLowerCase());
  const [userLocation, setUserLocation] = useState({
    latitude: 19.0760,
    longitude: 72.8777,
  });
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (e) {
        console.log('Location access failed:', e);
      } finally {
        setLocLoading(false);
      }
    };

    init();
  }, []);

  const mapComplaints = complaints.filter(c => c.latitude !== null && c.longitude !== null);

  if (loading || locLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.purple} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating HUD Header Card */}
      <View style={styles.hudHeader}>
        <NxText variant="mono" color={colors.purple} style={styles.tag}>
          CIVIC GPS MONITOR
        </NxText>
        <NxText variant="h3" style={styles.hudTitle}>
          Live Incident Map
        </NxText>
        <NxText variant="caption" color={colors.text2}>
          {mapComplaints.length} active markers tracked in {activeCity.charAt(0).toUpperCase() + activeCity.slice(1).toLowerCase()}
        </NxText>
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        showsUserLocation={true}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        }}
      >
        {mapComplaints.map((complaint) => {
          const color = statusColors[complaint.status ?? 'submitted'] || '#5a8de0';
          return (
            <Marker
              key={complaint.id}
              coordinate={{
                latitude: complaint.latitude!,
                longitude: complaint.longitude!,
              }}
              title={complaint.title}
              description={`${complaint.category} · ${complaint.status}`}
            >
              {/* Custom Cyberpunk Neon Glowing Dot Marker */}
              <View style={[styles.markerContainer, { borderColor: color }]}>
                <View style={[styles.markerDot, { backgroundColor: color }]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Floating Legend HUD Panel */}
      <View style={styles.legendPanel}>
        <NxText variant="mono" color={colors.gold} style={styles.legendHeading}>
          INCIDENT STATUS LEGEND
        </NxText>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.statusDot, { backgroundColor: '#5a8de0' }]} />
            <NxText variant="caption" style={styles.legendText}>Submit</NxText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.statusDot, { backgroundColor: colors.teal }]} />
            <NxText variant="caption" style={styles.legendText}>Verify</NxText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.statusDot, { backgroundColor: colors.gold }]} />
            <NxText variant="caption" style={styles.legendText}>Assign</NxText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.statusDot, { backgroundColor: colors.orange }]} />
            <NxText variant="caption" style={styles.legendText}>Progress</NxText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
            <NxText variant="caption" style={styles.legendText}>Resolve</NxText>
          </View>
        </View>
      </View>
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#09090c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a7a92' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#040406' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#161622' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040406' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center:    { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  map:       { flex: 1 },
  hudHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(20, 20, 28, 0.82)',
    borderColor: 'rgba(155, 95, 224, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  tag:       { letterSpacing: 2, fontSize: 9, fontWeight: '700' },
  hudTitle:  { marginTop: 2, fontWeight: '800' },
  legendPanel: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(20, 20, 28, 0.82)',
    borderColor: colors.border2,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  legendHeading: { fontSize: 8, letterSpacing: 1.5, marginBottom: 8, fontWeight: 'bold' },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: { fontSize: 9, color: colors.text },
  markerContainer: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 1.5,
    elevation: 3,
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});