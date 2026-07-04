import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { OsmFeature } from '../lib/osmContext';
import { colors } from '../theme/tokens';

interface InfrastructureMapProps {
  latitude: number;
  longitude: number;
  features?: OsmFeature[];
}

export function InfrastructureMap({ latitude, longitude, features = [] }: InfrastructureMapProps) {
  const getFeatureColor = (type: string): string => {
    if (type.startsWith('building')) return colors.purple;
    if (type.startsWith('road')) return colors.teal;
    if (type.startsWith('amenity')) return colors.gold;
    return colors.text2;
  };

  return (
    <View style={styles.wrapper}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {/* Issue Location Marker */}
        <Marker
          coordinate={{ latitude, longitude }}
          title="Reported Issue Location"
          pinColor={colors.red}
        />

        {/* OSM Infrastructure Markers */}
        {features.map((feat, idx) => {
          if (!feat.lat || !feat.lng) return null;
          const markerColor = getFeatureColor(feat.type);
          return (
            <Marker
              key={`osm-${idx}`}
              coordinate={{ latitude: feat.lat, longitude: feat.lng }}
              title={feat.name || feat.type}
              description={feat.type}
            >
              <View style={[styles.markerContainer, { borderColor: markerColor }]}>
                <View style={[styles.markerDot, { backgroundColor: markerColor }]} />
              </View>
            </Marker>
          );
        })}
      </MapView>
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
  wrapper: {
    width: '100%',
    height: 240,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border2,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
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
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
