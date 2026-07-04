export interface GeocodedLocation {
  lat: number;
  lng: number;
  displayName: string;
}

function cleanSpelling(text: string): string {
  return text
    .replace(/goreg[aeo]+n/gi, 'goregaon')
    .replace(/goreagon/gi, 'goregaon')
    .replace(/gorgegaon/gi, 'goregaon')
    .replace(/andhrei/gi, 'andheri')
    .replace(/bandre/gi, 'bandra');
}

async function tryGeocode(query: string): Promise<GeocodedLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'NexoraMobileApp/1.0 (civic complaint app)',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch (e) {
    console.log('Geocoding failed:', e);
    return null;
  }
}

export async function geocodeLocation(query: string, cityName: string = 'Mumbai', stateName: string = 'Maharashtra'): Promise<GeocodedLocation | null> {
  const cleanedQuery = cleanSpelling(query);

  // Attempt 1: full cleaned query with real city context
  const fullAttempt = await tryGeocode(`${cleanedQuery}, ${cityName}, ${stateName}, India`);
  if (fullAttempt) return fullAttempt;

  console.log('Full geocode failed, trying broader area fallback for:', cleanedQuery);

  // Attempt 2: strip landmark, keep only the area/locality name
  const parts = cleanedQuery.split(/,|\bnear\b|\bin\b/i).map(p => p.trim()).filter(Boolean);
  const broaderArea = cleanSpelling(parts[parts.length - 1]);

  if (broaderArea && broaderArea.toLowerCase() !== cleanedQuery.toLowerCase()) {
    const broaderAttempt = await tryGeocode(`${broaderArea}, ${cityName}, ${stateName}, India`);
    if (broaderAttempt) {
      console.log('Broader area geocode succeeded:', broaderArea);
      return broaderAttempt;
    }
  }

  // Attempt 3: just the city itself as absolute last fallback
  const cityAttempt = await tryGeocode(`${cityName}, ${stateName}, India`);
  if (cityAttempt) {
    console.log('Falling back to city center:', cityName);
    return cityAttempt;
  }

  return null;
}