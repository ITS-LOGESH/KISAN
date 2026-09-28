import React from 'react';
import { Layers, Plus, Compass } from 'lucide-react';

interface FieldVisualProps {
  cropType: string;
  boundaryGeoJson?: string | null;
  areaAcres?: number | null;
  name?: string;
  variant?: 'hero' | 'card' | 'compact';
  className?: string;
  onAddBoundary?: () => void;
}

export const FieldVisual: React.FC<FieldVisualProps> = ({
  cropType,
  boundaryGeoJson,
  areaAcres,
  name,
  variant = 'card',
  className = '',
  onAddBoundary,
}) => {
  // Theme per registered crop
  const getCropTheme = (crop: string) => {
    const c = crop.toLowerCase();
    if (c.includes('rice') || c.includes('paddy')) {
      return {
        fill: '#1D5A49',
        fillLight: '#2B7A63',
        patternColor: '#349377',
        boundaryStroke: '#10B981',
        dotColor: '#34D399',
        soilDepth: '#3A2617',
        label: 'Paddy / Wetland',
      };
    } else if (c.includes('wheat')) {
      return {
        fill: '#7E4B14',
        fillLight: '#9E6215',
        patternColor: '#C78520',
        boundaryStroke: '#F59E0B',
        dotColor: '#FBBF24',
        soilDepth: '#442813',
        label: 'Wheat / Dryland',
      };
    } else if (c.includes('cotton')) {
      return {
        fill: '#1E293B',
        fillLight: '#334155',
        patternColor: '#64748B',
        boundaryStroke: '#94A3B8',
        dotColor: '#CBD5E1',
        soilDepth: '#1A202C',
        label: 'Cotton / Furrows',
      };
    } else if (c.includes('millet') || c.includes('ragi')) {
      return {
        fill: '#5C4535',
        fillLight: '#785942',
        patternColor: '#9C7557',
        boundaryStroke: '#D97706',
        dotColor: '#F59E0B',
        soilDepth: '#342114',
        label: 'Millet / Rainfed',
      };
    }
    return {
      fill: '#1D5A49',
      fillLight: '#25745E',
      patternColor: '#349377',
      boundaryStroke: '#10B981',
      dotColor: '#34D399',
      soilDepth: '#281E15',
      label: 'Cultivated Parcel',
    };
  };

  const theme = getCropTheme(cropType);

  const containerHeight = {
    hero: 'h-64 sm:h-80 w-full',
    card: 'h-48 sm:h-56 w-full',
    compact: 'h-32 w-full',
  }[variant];

  const viewBoxWidth = variant === 'hero' ? 420 : variant === 'card' ? 320 : 240;
  const viewBoxHeight = variant === 'hero' ? 260 : variant === 'card' ? 200 : 140;

  // Real GeoJSON parsing logic
  const parseCoordinates = (): { points: [number, number][]; centroid: [number, number] } | null => {
    if (!boundaryGeoJson) return null;
    try {
      const parsed = typeof boundaryGeoJson === 'string' ? JSON.parse(boundaryGeoJson) : boundaryGeoJson;
      let rawCoords: number[][] = [];
      if (parsed.type === 'Polygon' && Array.isArray(parsed.coordinates) && parsed.coordinates[0]?.length >= 3) {
        rawCoords = parsed.coordinates[0];
      } else if (parsed.type === 'Feature' && parsed.geometry?.type === 'Polygon' && Array.isArray(parsed.geometry.coordinates)) {
        rawCoords = parsed.geometry.coordinates[0];
      }
      if (rawCoords.length < 3) return null;

      // Extract unique points
      const pts: [number, number][] = [];
      for (let i = 0; i < rawCoords.length; i++) {
        // Exclude redundant closing point if identical to first
        if (i === rawCoords.length - 1 && rawCoords.length > 3 && rawCoords[i][0] === rawCoords[0][0] && rawCoords[i][1] === rawCoords[0][1]) {
          continue;
        }
        pts.push([rawCoords[i][0], rawCoords[i][1]]); // [lng, lat]
      }
      if (pts.length < 3) return null;

      // Find bounding box
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      let sumLng = 0, sumLat = 0;
      pts.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        sumLng += lng;
        sumLat += lat;
      });

      const lngSpan = maxLng - minLng || 0.0001;
      const latSpan = maxLat - minLat || 0.0001;

      // Map to SVG coordinates with padding
      const padX = variant === 'hero' ? 50 : 36;
      const padY = variant === 'hero' ? 45 : 32;
      const innerW = viewBoxWidth - padX * 2;
      const innerH = viewBoxHeight - padY * 2;

      const projected: [number, number][] = pts.map(([lng, lat]) => {
        const x = padX + ((lng - minLng) / lngSpan) * innerW;
        // North is top, so invert Y
        const y = padY + ((maxLat - lat) / latSpan) * innerH;
        return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
      });

      const avgLng = sumLng / pts.length;
      const avgLat = sumLat / pts.length;
      const centroidX = padX + ((avgLng - minLng) / lngSpan) * innerW;
      const centroidY = padY + ((maxLat - avgLat) / latSpan) * innerH;

      return { points: projected, centroid: [Math.round(centroidX * 10) / 10, Math.round(centroidY * 10) / 10] };
    } catch {
      return null;
    }
  };

  const parsedGeometry = parseCoordinates();

  // If no real geometry exists, display honest empty state / Digital Twin Fallback
  if (!parsedGeometry) {
    return (
      <div
        className={`relative rounded-3xl overflow-hidden bg-[#181310] border border-[#E8E2D8] flex flex-col items-center justify-center p-6 text-center select-none ${containerHeight} ${className}`}
      >
        {/* Subtle survey grid background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#D5C2AD 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center max-w-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FBDD97] mb-1">
            <Compass className="w-5 h-5" />
          </div>

          <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[#C78520]">
            FIELD DIGITAL TWIN
          </span>

          <h4 className="font-serif font-bold text-white text-base sm:text-lg leading-snug">
            Your field will appear here
          </h4>

          <p className="text-xs text-white/70 font-light leading-relaxed">
            Add a field boundary to create your digital field.
          </p>

          <div className="pt-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-mono text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Field boundary not available</span>
            </span>
          </div>
        </div>

        {/* Bottom Metadata */}
        {name && (
          <div className="absolute bottom-2.5 left-4 right-4 z-10 flex items-center justify-between text-xs text-white/60 font-mono">
            <span className="truncate">{name}</span>
            <span>Centroid only</span>
          </div>
        )}
      </div>
    );
  }

  // Real Geometry: Render authentic polygon from backend coordinates
  const { points, centroid } = parsedGeometry;
  const polygonPointsStr = points.map(([x, y]) => `${x},${y}`).join(' ');

  // Extruded 2.5D soil depth polygon (offset down by 10px)
  const depthOffset = variant === 'hero' ? 12 : 8;
  const depthPointsStr = points.map(([x, y]) => `${x},${y + depthOffset}`).join(' ');

  return (
    <div
      className={`relative rounded-3xl overflow-hidden bg-[#14100D] select-none ${containerHeight} ${className}`}
      style={{
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
      }}
    >
      {/* Background Soft Terrain Gradient */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-multiply"
        style={{
          background: `radial-gradient(ellipse at center, ${theme.fillLight} 0%, #0E0A08 100%)`,
        }}
      />

      {/* SVG Cadastral Parcel Geometry based strictly on REAL field boundary */}
      <svg
        className="w-full h-full object-contain filter drop-shadow-lg p-2"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Furrow / Crop Row Pattern */}
          <pattern
            id={`furrows-${cropType.replace(/\s+/g, '-')}-${variant}`}
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(28)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="12"
              stroke={theme.patternColor}
              strokeWidth="1.6"
              strokeOpacity="0.5"
            />
          </pattern>

          {/* Land gradient */}
          <linearGradient id={`landGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.fillLight} stopOpacity="0.95" />
            <stop offset="100%" stopColor={theme.fill} stopOpacity="0.85" />
          </linearGradient>

          {/* Soil depth extrusion gradient */}
          <linearGradient id={`soilDepth-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme.soilDepth} stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1C1510" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Ambient Farm Coordinate Grid */}
        <g opacity="0.12" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="3 3">
          <line x1="0" y1={viewBoxHeight * 0.25} x2={viewBoxWidth} y2={viewBoxHeight * 0.25} />
          <line x1="0" y1={viewBoxHeight * 0.5} x2={viewBoxWidth} y2={viewBoxHeight * 0.5} />
          <line x1="0" y1={viewBoxHeight * 0.75} x2={viewBoxWidth} y2={viewBoxHeight * 0.75} />
          <line x1={viewBoxWidth * 0.25} y1="0" x2={viewBoxWidth * 0.25} y2={viewBoxHeight} />
          <line x1={viewBoxWidth * 0.5} y1="0" x2={viewBoxWidth * 0.5} y2={viewBoxHeight} />
          <line x1={viewBoxWidth * 0.75} y1="0" x2={viewBoxWidth * 0.75} y2={viewBoxHeight} />
        </g>

        {/* Extruded Subsoil Depth Layer (Elevated Field Physical Geometry) */}
        <polygon
          points={depthPointsStr}
          fill={`url(#soilDepth-${variant})`}
        />

        {/* Real Field Polygon Land Fill */}
        <polygon
          points={polygonPointsStr}
          fill={`url(#landGrad-${variant})`}
        />

        {/* Crop Furrow Row Overlay strictly inside real boundary */}
        <polygon
          points={polygonPointsStr}
          fill={`url(#furrows-${cropType.replace(/\s+/g, '-')}-${variant})`}
        />

        {/* Cadastral Boundary Perimeter Stroke */}
        <polygon
          points={polygonPointsStr}
          fill="none"
          stroke={theme.boundaryStroke}
          strokeWidth="2.5"
          strokeDasharray="6 3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Vertex Survey Boundary Dots at REAL polygon vertices */}
        {points.map(([px, py], i) => (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={variant === 'hero' ? 4 : 3}
            fill="#FFFFFF"
            stroke={theme.boundaryStroke}
            strokeWidth={1.5}
          />
        ))}

        {/* Real Centroid Marker */}
        <circle
          cx={centroid[0]}
          cy={centroid[1]}
          r={variant === 'hero' ? 5 : 3.5}
          fill={theme.dotColor}
          className="animate-pulse"
        />
      </svg>

      {/* Top Left Cadastral Metadata Pill */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-semibold tracking-wider text-white/90">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: theme.dotColor }}
        />
        <span className="uppercase">{cropType}</span>
      </div>

      {/* Top Right Area Tag */}
      {areaAcres != null && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-harvest-300 font-semibold">
          {areaAcres.toFixed(1)} ac
        </div>
      )}

      {/* Bottom Subtle Overlay Gradient for Title Legibility */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

      {name && (
        <div className="absolute bottom-2.5 left-3.5 right-3.5 z-10 flex items-center justify-between text-xs">
          <span className="font-serif font-bold text-white tracking-tight truncate max-w-[70%]">
            {name}
          </span>
          <span className="font-mono text-[10px] text-emerald-400">
            Real Cadastral Polygon
          </span>
        </div>
      )}
    </div>
  );
};
