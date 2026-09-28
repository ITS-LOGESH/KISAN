/**
 * KrishiNet Geodesic & Cadastral Polygon Utility
 * Calculates true physical farm area in acres using spherical polygon calculation (WGS-84).
 * ₹0 Cost - No external paid GIS/API dependencies required.
 */

export interface LatLngPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_METERS = 6378137.0; // WGS84 equatorial radius
const SQ_METERS_PER_ACRE = 4046.8564224;

/**
 * Computes spherical polygon area in square meters.
 * Uses the spherical excess formula with coordinate wrapping.
 */
export function calculateSphericalAreaSqMeters(coordinates: LatLngPoint[]): number {
  if (!coordinates || coordinates.length < 3) {
    return 0;
  }

  const numPoints = coordinates.length;
  let total = 0;

  for (let i = 0; i < numPoints; i++) {
    const prev = coordinates[(i + numPoints - 1) % numPoints];
    const curr = coordinates[i];
    const next = coordinates[(i + 1) % numPoints];

    const prevLngRad = (prev.lng * Math.PI) / 180;
    const nextLngRad = (next.lng * Math.PI) / 180;
    const currLatRad = (curr.lat * Math.PI) / 180;

    total += (nextLngRad - prevLngRad) * Math.sin(currLatRad);
  }

  const areaSqMeters = Math.abs((total * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2.0);
  return areaSqMeters;
}

/**
 * Calculates genuine physical area of field in acres from boundary coordinates.
 */
export function calculatePolygonAreaAcres(coordinates: LatLngPoint[]): number {
  const sqMeters = calculateSphericalAreaSqMeters(coordinates);
  if (sqMeters === 0) return 0;
  const acres = sqMeters / SQ_METERS_PER_ACRE;
  // Round to 2 decimal places
  return Math.round(acres * 100) / 100;
}

/**
 * Formats acres for user presentation.
 */
export function formatAcres(acres: number | null | undefined): string {
  if (acres === null || acres === undefined || isNaN(acres) || acres <= 0) {
    return 'Area not specified';
  }
  return `${acres.toFixed(2)} Acres`;
}

/**
 * Calculates center (centroid) of a set of coordinates.
 */
export function calculateCenter(points: LatLngPoint[]): LatLngPoint {
  if (!points || points.length === 0) {
    return { lat: 20.5937, lng: 78.9629 }; // India default center
  }

  let latSum = 0;
  let lngSum = 0;

  for (const pt of points) {
    latSum += pt.lat;
    lngSum += pt.lng;
  }

  return {
    lat: latSum / points.length,
    lng: lngSum / points.length,
  };
}

/**
 * Converts GeoJSON Polygon or MultiPolygon coordinates into array of LatLngPoints for Leaflet.
 */
export function parseGeoJsonCoordinates(geoJsonStr?: string | null): LatLngPoint[] {
  if (!geoJsonStr) return [];
  try {
    const parsed = typeof geoJsonStr === 'string' ? JSON.parse(geoJsonStr) : geoJsonStr;
    if (parsed.type === 'Polygon' && Array.isArray(parsed.coordinates) && parsed.coordinates.length > 0) {
      // First ring is outer boundary
      const ring = parsed.coordinates[0];
      return ring.map((coord: [number, number]) => ({
        lat: coord[1],
        lng: coord[0],
      }));
    }
  } catch (err) {
    console.warn('Failed to parse GeoJSON coordinates', err);
  }
  return [];
}

/**
 * Converts array of LatLngPoint into GeoJSON string for persistence in backend.
 */
export function toGeoJsonString(points: LatLngPoint[]): string {
  if (!points || points.length < 3) return '';
  // Coordinates in GeoJSON are [longitude, latitude]
  const coords = points.map((pt) => [pt.lng, pt.lat]);
  // Close the ring if not already closed
  if (
    coords.length > 0 &&
    (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])
  ) {
    coords.push([coords[0][0], coords[0][1]]);
  }

  return JSON.stringify({
    type: 'Polygon',
    coordinates: [coords],
  });
}
