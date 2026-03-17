import { Coordinates, Landmark, Location, MapProvider, FAMOUS_LOCATIONS } from '../../shared/types';

/**
 * Mapbox adapter - alternative map provider using Mapbox APIs.
 * Demonstrates the Adapter pattern for swapping providers.
 */
export class MapboxAdapter implements MapProvider {
  name = 'mapbox';
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.MAPBOX_ACCESS_TOKEN || '';
  }

  getStreetViewUrl(coords: Coordinates, heading = 0, _pitch = 0): string {
    // Mapbox doesn't have street view, use static imagery instead
    const base = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static';
    return `${base}/${coords.lng},${coords.lat},15,${heading}/600x400?access_token=${this.accessToken}`;
  }

  getStaticMapUrl(coords: Coordinates, zoom = 14): string {
    const base = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static';
    return `${base}/pin-l+f44(${coords.lng},${coords.lat})/${coords.lng},${coords.lat},${zoom}/600x400?access_token=${this.accessToken}`;
  }

  async geocode(query: string): Promise<Location> {
    const lower = query.toLowerCase();
    const found = FAMOUS_LOCATIONS.find(
      l => l.name.toLowerCase().includes(lower) ||
           l.city.toLowerCase().includes(lower) ||
           l.country.toLowerCase().includes(lower)
    );
    if (found) return found;

    const hash = this.simpleHash(query);
    const lat = (hash % 18000 - 9000) / 100;
    const lng = ((hash * 7) % 36000 - 18000) / 100;
    return {
      coordinates: { lat, lng },
      name: query,
      country: 'Unknown',
      city: query,
    };
  }

  async reverseGeocode(coords: Coordinates): Promise<Location> {
    let nearest = FAMOUS_LOCATIONS[0];
    let minDist = Infinity;
    for (const loc of FAMOUS_LOCATIONS) {
      const dist = this.haversineDistance(coords, loc.coordinates);
      if (dist < minDist) {
        minDist = dist;
        nearest = loc;
      }
    }
    if (minDist < 50) return nearest;
    return {
      coordinates: coords,
      name: `Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
      country: 'Unknown',
      city: 'Unknown',
    };
  }

  async getDirections(origin: Coordinates, dest: Coordinates): Promise<{ distanceKm: number; durationHours: number; route: Coordinates[] }> {
    const distanceKm = this.haversineDistance(origin, dest);
    const durationHours = distanceKm / 80;
    const steps = Math.max(2, Math.floor(distanceKm / 100));
    const route: Coordinates[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      route.push({
        lat: origin.lat + (dest.lat - origin.lat) * t,
        lng: origin.lng + (dest.lng - origin.lng) * t,
      });
    }
    return { distanceKm: Math.round(distanceKm), durationHours: Math.round(durationHours * 10) / 10, route };
  }

  async getNearbyLandmarks(coords: Coordinates, radiusKm = 50): Promise<Landmark[]> {
    return FAMOUS_LOCATIONS
      .filter(loc => this.haversineDistance(coords, loc.coordinates) <= radiusKm)
      .map(loc => ({
        name: loc.name,
        location: loc,
        type: 'landmark',
        description: loc.description || `Famous landmark in ${loc.city}`,
        rating: 4 + Math.random(),
      }));
  }

  private haversineDistance(a: Coordinates, b: Coordinates): number {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const sin2Lat = Math.sin(dLat / 2) ** 2;
    const sin2Lng = Math.sin(dLng / 2) ** 2;
    const aVal = sin2Lat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sin2Lng;
    return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
}
