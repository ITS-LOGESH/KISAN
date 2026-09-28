import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Field } from '../types';
import { DemoBadge } from './DemoBadge';
import { Eye, Globe, Compass, Plus, AlertCircle } from 'lucide-react';

// Real GeoJSON Parser for Leaflet coordinates ([lat, lng])
export const parseBoundaryGeoJson = (geojsonStr?: string | null): [number, number][] | null => {
  if (!geojsonStr) return null;
  try {
    const parsed = typeof geojsonStr === 'string' ? JSON.parse(geojsonStr) : geojsonStr;
    let coords: number[][] = [];
    if (parsed.type === 'Polygon' && Array.isArray(parsed.coordinates) && parsed.coordinates[0]?.length >= 3) {
      coords = parsed.coordinates[0];
    } else if (parsed.type === 'Feature' && parsed.geometry?.type === 'Polygon' && Array.isArray(parsed.geometry.coordinates)) {
      coords = parsed.geometry.coordinates[0];
    }
    if (coords.length >= 3) {
      // GeoJSON has [lng, lat]; Leaflet Polygon expects [lat, lng]
      return coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
    }
  } catch (err) {
    console.warn('Invalid boundary_geojson:', err);
  }
  return null;
};

// Custom Map Marker Pin Styling per Crop Type
const createCustomIcon = (cropType: string, isDemo: boolean, isSelected: boolean) => {
  let bgColor = '#1B4D3E'; // Paddy/Rice - deep moss
  const c = cropType.toLowerCase();
  if (c.includes('wheat')) bgColor = '#9E6215'; // Wheat - warm harvest amber
  else if (c.includes('cotton')) bgColor = '#312E81'; // Cotton - deep indigo
  else if (c.includes('millet') || c.includes('ragi')) bgColor = '#78350F'; // Millet - earth brown
  else if (c.includes('maize')) bgColor = '#B45309'; // Maize - gold
  else if (c.includes('groundnut')) bgColor = '#15803D'; // Groundnut - green

  const ringColor = isSelected ? '#C78520' : isDemo ? '#EAB308' : '#10B981';
  const size = isSelected ? 36 : 30;

  return L.divIcon({
    className: 'custom-field-pin',
    html: `
      <div style="
        background-color: ${bgColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: ${isSelected ? '3px' : '2px'} solid ${ringColor};
        box-shadow: 0 ${isSelected ? '6px 14px' : '3px 6px'} rgba(28, 21, 16, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: ${isSelected ? '11px' : '9px'};
          font-weight: 800;
          font-family: 'Plus Jakarta Sans', sans-serif;
        ">
          ${cropType.charAt(0).toUpperCase()}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

interface MapUpdaterProps {
  selectedField: Field | null;
  zoomLevel?: number;
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ selectedField, zoomLevel = 17 }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedField) {
      const polygonCoords = parseBoundaryGeoJson(selectedField.boundary_geojson);
      if (polygonCoords && polygonCoords.length >= 3) {
        // Center tightly around the actual parcel polygon
        const bounds = L.latLngBounds(polygonCoords);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 18,
          animate: true,
          duration: 1.0,
        });
      } else {
        // Fallback to coordinates when no boundary polygon exists
        map.flyTo([selectedField.latitude, selectedField.longitude], zoomLevel, {
          duration: 1.2,
          easeLinearity: 0.25,
        });
      }
    }
  }, [selectedField, zoomLevel, map]);
  return null;
};

interface MapEventsProps {
  onLocationSelect?: (lat: number, lon: number) => void;
}

const MapClickHandler: React.FC<MapEventsProps> = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

interface IndiaMapProps {
  fields: Field[];
  selectedField: Field | null;
  onSelectField: (field: Field) => void;
  onLocationSelect?: (lat: number, lon: number) => void;
  onViewTwin?: (field: Field) => void;
  height?: string;
  showBoundaryPolygons?: boolean;
  className?: string;
  onAddFieldClick?: () => void;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({
  fields,
  selectedField,
  onSelectField,
  onLocationSelect,
  onViewTwin,
  height = '520px',
  showBoundaryPolygons = true,
  className = '',
  onAddFieldClick,
}) => {
  const [mapLayer, setMapLayer] = useState<'satellite' | 'streets'>('satellite');

  // Center coordinate determination (strictly real)
  const defaultCenter: [number, number] = selectedField
    ? [selectedField.latitude, selectedField.longitude]
    : fields.length > 0
    ? [fields[0].latitude, fields[0].longitude]
    : [10.787, 79.1378]; // Fallback coordinates if no field exists

  const hasFields = fields.length > 0 || selectedField !== null;

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-[#E8E2D8] shadow-elevated bg-[#F4EDE4] ${className}`}
      style={{ height }}
    >
      {hasFields ? (
        <MapContainer
          center={defaultCenter}
          zoom={selectedField ? 17 : 12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {mapLayer === 'streets' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a> &amp; Maxar Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          )}

          <MapUpdater selectedField={selectedField} zoomLevel={17} />
          {onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}

          {/* Real Field Boundary Polygons from Backend Only */}
          {showBoundaryPolygons &&
            fields.map((field) => {
              const isSelected = selectedField?.id === field.id;
              const realPolygonCoords = parseBoundaryGeoJson(field.boundary_geojson);

              // Do NOT invent polygons if none exist
              if (!realPolygonCoords) return null;

              return (
                <Polygon
                  key={`poly-${field.id}`}
                  positions={realPolygonCoords}
                  pathOptions={{
                    color: isSelected ? '#F59E0B' : '#10B981',
                    weight: isSelected ? 3.5 : 2.5,
                    fillColor: '#10B981',
                    fillOpacity: isSelected ? 0.18 : 0.12, // Transparent fill so real satellite imagery remains clearly visible
                    dashArray: isSelected ? undefined : '5, 4',
                  }}
                  eventHandlers={{
                    click: () => onSelectField(field),
                  }}
                >
                  <Popup autoPan={true}>
                    <div className="p-1 font-sans text-xs">
                      <div className="font-bold text-[#1C1510]">{field.name} Boundary</div>
                      <div className="text-[#5C4535] text-[11px] mt-0.5">
                        {field.area_acres ? `${field.area_acres.toFixed(2)} Acres` : 'Area not calculated'} • {field.crop_type}
                      </div>
                      <div className="text-[10px] text-[#786C60] font-mono mt-1">
                        Lat: {field.latitude.toFixed(4)}, Lon: {field.longitude.toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

          {/* Real Field Location Centroid Pins — shown only when no boundary polygon exists to avoid obscuring parcel land */}
          {fields.map((field) => {
            const isSelected = selectedField?.id === field.id;
            const hasRealBoundary = Boolean(parseBoundaryGeoJson(field.boundary_geojson));

            // Hide pin if confirmed boundary is being displayed, keeping land imagery unobstructed
            if (showBoundaryPolygons && hasRealBoundary) {
              return null;
            }

            return (
              <Marker
                key={`marker-${field.id}`}
                position={[field.latitude, field.longitude]}
                icon={createCustomIcon(field.crop_type, field.is_demo, isSelected)}
                eventHandlers={{
                  click: () => onSelectField(field),
                }}
              >
                <Popup className="custom-field-popup" autoPan={true}>
                  <div className="p-2 min-w-[220px] max-w-[260px] font-sans">
                    <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-[#E8E2D8] pb-1">
                      <span className="text-[10px] font-mono font-bold text-[#786C60] uppercase">
                        FIELD #{field.id}
                      </span>
                      {field.is_demo ? (
                        <DemoBadge size="sm" />
                      ) : (
                        <span className="bg-[#E8F5F0] text-[#1B4D3E] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#BEE9DC]">
                          REGISTERED
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif font-bold text-[#1C1510] text-sm mb-1 leading-snug">
                      {field.name}
                    </h4>

                    <div className="text-xs text-[#5C4535] space-y-1 mb-3 bg-[#FAF8F4] p-2 rounded-lg border border-[#E8E2D8]">
                      <div className="flex justify-between">
                        <span className="text-[#786C60]">Crop:</span>
                        <strong className="text-[#1B4D3E]">{field.crop_type}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786C60]">Location:</span>
                        <span className="font-medium text-[#1C1510]">
                          {field.district ? `${field.district}, ` : ''}{field.state}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786C60]">Area:</span>
                        <span className="font-semibold text-[#1C1510]">
                          {field.area_acres ? `${field.area_acres.toFixed(2)} Acres` : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786C60]">Boundary:</span>
                        <span className={`font-semibold ${hasRealBoundary ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {hasRealBoundary ? 'GeoJSON Polygon' : 'Not available'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectField(field)}
                      className="w-full py-1.5 px-3 bg-[#1B4D3E] hover:bg-[#153D31] text-white font-medium text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-subtle cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Telemetry</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      ) : (
        /* Empty State: Problem 3 & Problem 10 - Honest and clean */
        <div className="absolute inset-0 bg-[#FAF8F4] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-sm p-6 rounded-2xl bg-white border border-[#E8E2D8] shadow-elevated space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5F0] border border-[#BEE9DC] flex items-center justify-center text-[#1B4D3E] mx-auto">
              <Compass className="w-6 h-6" />
            </div>

            <h4 className="font-serif font-bold text-lg text-[#1C1510]">
              No field location yet
            </h4>

            <p className="text-xs text-[#5C4535] leading-relaxed">
              Location will appear after you add a field. We only show real coordinates from your registered land.
            </p>

            {onAddFieldClick && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onAddFieldClick}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#153D31] text-white text-xs font-bold transition-all shadow-subtle cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Field</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Minimal Layer Switcher (Satellite vs Carto) */}
      {hasFields && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-[#E8E2D8] shadow-subtle text-xs">
          <button
            onClick={() => setMapLayer(mapLayer === 'streets' ? 'satellite' : 'streets')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
              mapLayer === 'satellite'
                ? 'bg-[#1B4D3E] text-white shadow-subtle'
                : 'text-[#5C4535] hover:bg-[#FAF8F4]'
            }`}
            title="Toggle Imagery vs Cartography"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">{mapLayer === 'satellite' ? 'Satellite' : 'Carto'}</span>
          </button>
        </div>
      )}

      {/* Bottom Floating Legend (Only when fields exist) */}
      {hasFields && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[#E8E2D8] text-xs shadow-elevated space-y-1 max-w-[260px]">
          <div className="font-serif font-bold text-[#1C1510] flex items-center justify-between text-xs border-b border-[#E8E2D8] pb-1">
            <span>Land Parcel Cartography</span>
            <span className="text-[10px] text-[#786C60] font-mono">WGS84</span>
          </div>
          <div className="text-[10px] text-[#5C4535] flex items-center space-x-2 pt-0.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block shrink-0" />
            <span>Real GeoJSON boundary</span>
          </div>
        </div>
      )}
    </div>
  );
};
