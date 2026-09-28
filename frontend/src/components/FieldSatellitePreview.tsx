import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { parseBoundaryGeoJson } from './IndiaMap';
import { Compass, Eye } from 'lucide-react';

interface FieldSatellitePreviewProps {
  boundaryGeoJson?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cropType?: string;
  name?: string;
  height?: string;
  className?: string;
}

// Helper to auto-fit bounds on parcel polygon
const MapBoundsFitter: React.FC<{
  coords: [number, number][];
  center?: [number, number];
  zoom?: number;
}> = ({ coords, center, zoom = 17 }) => {
  const map = useMap();

  useEffect(() => {
    if (coords && coords.length >= 3) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, {
        padding: [24, 24],
        maxZoom: 18,
        animate: false,
      });
    } else if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: false });
    }
  }, [coords, center, zoom, map]);

  return null;
};

// Subtle pulsing pin for coordinate-only parcels
const createCentroidDot = () => {
  return L.divIcon({
    className: 'centroid-pulse-pin',
    html: `
      <div style="
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: #10B981;
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

export const FieldSatellitePreview: React.FC<FieldSatellitePreviewProps> = ({
  boundaryGeoJson,
  latitude,
  longitude,
  cropType = 'Crop',
  name,
  height = '180px',
  className = '',
}) => {
  const polygonCoords = parseBoundaryGeoJson(boundaryGeoJson);
  const hasValidBoundary = Boolean(polygonCoords && polygonCoords.length >= 3);
  const hasValidCoords = Boolean(latitude && longitude && !isNaN(latitude) && !isNaN(longitude));

  // Honest fallback state if no valid geometry or coordinates exist
  if (!hasValidBoundary && !hasValidCoords) {
    return (
      <div
        className={`relative w-full rounded-2xl overflow-hidden bg-[#FAF8F4] border border-[#E8E2D8] flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
        style={{ height }}
      >
        <div className="w-9 h-9 rounded-xl bg-[#E8F5F0] border border-[#BEE9DC] flex items-center justify-center text-[#1B4D3E] mb-2">
          <Compass className="w-4 h-4" />
        </div>
        <h5 className="font-serif font-bold text-xs text-[#1C1510]">
          Field boundary not yet mapped
        </h5>
        <p className="text-[11px] text-[#786C60] font-light max-w-xs mt-0.5">
          Cadastral satellite geometry will appear once a boundary is created.
        </p>
      </div>
    );
  }

  // Calculate default center point
  const defaultCenter: [number, number] = hasValidBoundary && polygonCoords
    ? [polygonCoords[0][0], polygonCoords[0][1]]
    : [latitude || 10.787, longitude || 79.1378];

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-[#E8E2D8] shadow-subtle group-hover:border-[#1B4D3E]/40 transition-colors ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={17}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Authentic Esri High-Resolution World Imagery Layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />

        <MapBoundsFitter
          coords={polygonCoords || []}
          center={defaultCenter}
          zoom={17}
        />

        {/* Real Field Boundary Polygon with Transparent Land Fill & High-Contrast Border */}
        {hasValidBoundary && polygonCoords && (
          <Polygon
            positions={polygonCoords}
            pathOptions={{
              color: '#F59E0B', // Amber/gold high-contrast cadastral line
              weight: 2.5,
              fillColor: '#10B981', // Emerald green
              fillOpacity: 0.15, // Transparent fill so real satellite ground is clearly visible
            }}
          />
        )}

        {/* Centroid Pin for Coordinate-Only fields */}
        {!hasValidBoundary && hasValidCoords && latitude && longitude && (
          <Marker position={[latitude, longitude]} icon={createCentroidDot()} />
        )}
      </MapContainer>

      {/* Top Provenance Badge */}
      <div className="absolute top-2.5 left-2.5 z-[400] flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-black/65 backdrop-blur-md text-[10px] font-mono text-white/90 border border-white/10 pointer-events-none select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>{hasValidBoundary ? 'Cadastral Parcel' : 'Centroid Point'}</span>
        <span>•</span>
        <span className="text-white/70">Esri Imagery</span>
      </div>

      {/* Hover Inspect Indicator */}
      <div className="absolute bottom-2.5 right-2.5 z-[400] opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-sans font-semibold text-[#1C1510] shadow-sm pointer-events-none select-none">
        <Eye className="w-3 h-3 text-[#1B4D3E]" />
        <span>View Parcel</span>
      </div>
    </div>
  );
};
