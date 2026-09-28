import React from 'react';
import { Field, WeatherData, SatelliteData, SoilData } from '../types';
import { IndiaMap } from './IndiaMap';
import { MapPin, Sparkles, Microscope, RefreshCw, Satellite, FileText } from 'lucide-react';

interface UnderstandFieldStoryProps {
  field: Field | null;
  allFields: Field[];
  weather: WeatherData | null;
  satellite: SatelliteData | null;
  soil: SoilData | null;
  loadingTelemetry: boolean;
  onRefreshTelemetry: () => void;
  onSelectField: (field: Field) => void;
  onAskMyFieldClick: () => void;
  onCheckCropClick: () => void;
}

export const UnderstandFieldStory: React.FC<UnderstandFieldStoryProps> = ({
  field,
  allFields,
  weather,
  satellite,
  soil,
  loadingTelemetry,
  onRefreshTelemetry,
  onSelectField,
  onAskMyFieldClick,
  onCheckCropClick
}) => {
  if (!field) return null;

  return (
    <section id="enter-field" className="scroll-mt-24 space-y-8 mb-24 px-6 sm:px-12 lg:px-16 max-w-7xl mx-auto">
      {/* Editorial Field Identity Header — Calm, Monumental, No Clutter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-canvas-border pb-8">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-xs font-mono text-soil-500 uppercase tracking-widest font-semibold">
            <span>FIELD 0{field.id}</span>
            <span>•</span>
            <span>{field.district ? `${field.district}, ` : ''}{field.state}</span>
            <span>•</span>
            <span className="text-moss-800 font-bold">{field.crop_type}</span>
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-soil-950 tracking-tight leading-[0.98]">
            {field.name}
          </h2>

          <p className="text-base sm:text-lg text-soil-600 font-light max-w-xl">
            {field.area_acres || 3.0} Registered Acres • Cadastral Parcel Geometry
          </p>
        </div>

        {/* Minimal Contextual Action Triggers */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onCheckCropClick}
            className="px-5 py-3 rounded-full border border-canvas-border bg-white hover:bg-canvas-100 text-soil-900 font-sans text-xs font-semibold flex items-center space-x-2 transition-all shadow-subtle cursor-pointer"
          >
            <Microscope className="w-4 h-4 text-moss-700" />
            <span>Check Crop</span>
          </button>

          <button
            onClick={onAskMyFieldClick}
            className="px-6 py-3 rounded-full bg-moss-700 hover:bg-moss-800 text-white font-sans text-xs font-semibold flex items-center space-x-2 transition-all shadow-elevated cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-harvest-300" />
            <span>Ask My Field</span>
          </button>
        </div>
      </div>

      {/* THE MAP AS THE HERO: Expansive, Uncluttered, Dominant */}
      <div className="space-y-4">
        <div className="relative rounded-3xl overflow-hidden border border-canvas-border shadow-elevated bg-[#E8E2D8]">
          <IndiaMap
            fields={allFields}
            selectedField={field}
            onSelectField={onSelectField}
            height="620px"
            showBoundaryPolygons={true}
          />
        </div>

        {/* Minimal Information Bar under Map (No 10 floating cards over map!) */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-soil-500 px-2">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-medium text-soil-800">
              Boundary Centroid: {field.latitude.toFixed(4)}° N, {field.longitude.toFixed(4)}° E
            </span>
          </div>

          <div className="flex items-center space-x-4 text-soil-600">
            <span>
              Copernicus Scene: <strong className="text-soil-900">{satellite?.scene_id || 'STAC Discovery'}</strong>
            </span>
            <span>•</span>
            <span>
              Soil Profile: <strong className="text-soil-900">{soil?.source_type ? soil.source_type.replace('_', ' ') : 'Standard Regional'}</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
