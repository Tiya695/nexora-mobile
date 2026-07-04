import { OsmFeature } from './osmContext';

export interface SceneObject {
  type: string;
  name?: string;
  x: number;
  z: number;
  height: number;
  color: string;
}

// Converts lat/long offset into approximate meters (good enough for ~300m radius)
function metersPerDegree(lat: number) {
  const latMeters = 111320;
  const lngMeters = 111320 * Math.cos((lat * Math.PI) / 180);
  return { latMeters, lngMeters };
}

export function buildSceneFromFeatures(
  centerLat: number,
  centerLng: number,
  features: OsmFeature[]
): SceneObject[] {
  const { latMeters, lngMeters } = metersPerDegree(centerLat);

  return features
    .filter(f => f.lat !== undefined && f.lng !== undefined)
    .map((f) => {
      const dLat = (f.lat! - centerLat) * latMeters;
      const dLng = (f.lng! - centerLng) * lngMeters;

      // Scale meters down to a reasonable 3D scene size
      const scale = 0.05;
      const x = dLng * scale;
      const z = -dLat * scale; // negative so "north" goes forward

      let color = '#5a5a72';
      let height = 0.3;

      if (f.type.startsWith('building')) {
        color = '#9b5fe0';
        height = 0.8 + Math.random() * 1.2;
      } else if (f.type.startsWith('road')) {
        color = '#4cc9c0';
        height = 0.05;
      } else if (f.type.startsWith('amenity')) {
        color = '#c9a84c';
        height = 0.5;
      } else if (f.type.startsWith('infrastructure')) {
        color = '#e08a3c';
        height = 0.6;
      }

      return { type: f.type, name: f.name, x, z, height, color };
    });
}
