export interface OsmFeature {
  type: string;
  name?: string;
  distance?: number;
  lat?: number;
  lng?: number;
}

export async function fetchNearbyInfrastructure(
  latitude: number,
  longitude: number,
  radiusMeters: number = 300
): Promise<OsmFeature[]> {
  const query = `
    [out:json][timeout:10];
    (
      way["building"](around:${radiusMeters},${latitude},${longitude});
      way["highway"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"](around:${radiusMeters},${latitude},${longitude});
      way["man_made"](around:${radiusMeters},${latitude},${longitude});
    );
    out center tags;
  `;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'NexoraMobileApp/1.0 (civic complaint app)',
    'Accept': 'application/json',
  },
  body: `data=${encodeURIComponent(query)}`,
});
    if (!res.ok) {
      console.log('Overpass API error:', res.status);
      return [];
    }

    const data = await res.json();
    const elements = data.elements || [];

    const features: OsmFeature[] = elements
  .slice(0, 15)
  .map((el: any) => {
    const tags = el.tags || {};
    let type = 'unknown';
    if (tags.building) type = `building (${tags.building})`;
    else if (tags.highway) type = `road (${tags.highway})`;
    else if (tags.amenity) type = `amenity (${tags.amenity})`;
    else if (tags.man_made) type = `infrastructure (${tags.man_made})`;

    // Ways (buildings/roads) return a "center" object; nodes (amenities) return direct lat/lon
    const lat = el.center?.lat ?? el.lat;
    const lng = el.center?.lon ?? el.lon;

    return {
      type,
      name: tags.name || undefined,
      lat,
      lng,
    };
  });

    return features;
  } catch (e) {
    console.log('OSM fetch failed:', e);
    return [];
  }
}

export function formatInfrastructureForPrompt(features: OsmFeature[]): string {
  if (features.length === 0) {
    return 'No specific building/infrastructure data found nearby in OpenStreetMap for this location.';
  }

  const lines = features.map(f =>
    f.name ? `- ${f.type}: "${f.name}"` : `- ${f.type}`
  );

  return `Real nearby infrastructure detected (from OpenStreetMap, within ~100m):\n${lines.join('\n')}`;
}
