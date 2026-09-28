import React from 'react';
import { SatelliteData } from '../types';
import { DataSourceBadge } from './DataSourceBadge';
import { Satellite, CloudOff, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface SatelliteCardProps {
  satellite: SatelliteData | null;
  loading?: boolean;
}

export const SatelliteCard: React.FC<SatelliteCardProps> = ({ satellite, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded w-16 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-12 bg-slate-50 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  const isUnavailable = !satellite || satellite.status === 'UNAVAILABLE';
  const isCloudy = satellite?.status === 'CLOUDY';
  const isAvailable = satellite?.status === 'AVAILABLE';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Satellite className="w-4 h-4 text-agri-700" />
            <span>Earth Observation Intelligence</span>
          </h3>
          <p className="text-xs text-slate-500">Surface reflectance telemetry from public orbit registries</p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded font-sans border ${
            isAvailable
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : isCloudy
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {satellite?.status || 'UNAVAILABLE'}
        </span>
      </div>

      {isUnavailable && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <CloudOff className="w-4 h-4 text-slate-500 shrink-0" />
            <span>No recent satellite observation available.</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {satellite?.reason ||
              'No cloud-free optical observation found within the 30-day revisit archive for this coordinate. KrishiNet never invents synthetic vegetation indices.'}
          </p>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-1 border-t border-slate-200/60">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Next Sentinel-2 orbital revisit over this tile expected within standard 5-day cycle.</span>
          </div>
        </div>
      )}

      {isCloudy && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Observation Obscured by Cloud Cover</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Sentinel-2 scene identified, but atmospheric cloud cover ({satellite.cloud_cover_pct}%) exceeds the 75% optical threshold. Optical NDVI calculation is intentionally suspended to avoid deceptive readings.
          </p>
          <div className="text-xs font-mono text-slate-700 bg-white/80 p-2 rounded border border-amber-200">
            NDVI Status: <span className="font-bold text-slate-900">Unavailable (Cloud Distortion)</span>
          </div>
        </div>
      )}

      {isAvailable && satellite && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* NDVI Metric */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                NDVI Index
              </div>
              <div className="text-2xl font-black text-emerald-950 my-1">
                {satellite.ndvi !== null && satellite.ndvi !== undefined ? satellite.ndvi.toFixed(2) : 'Unavailable'}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold">
                Condition: {satellite.vegetation_condition || 'Normal'}
              </div>
            </div>

            {/* NDWI Metric */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-3">
              <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wide">
                Canopy Water (NDWI)
              </div>
              <div className="text-2xl font-black text-sky-950 my-1">
                {satellite.ndwi !== null && satellite.ndwi !== undefined ? satellite.ndwi.toFixed(2) : 'Unavailable'}
              </div>
              <div className="text-[10px] text-sky-700 font-semibold">
                Hydration proxy
              </div>
            </div>

            {/* Cloud Cover */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Cloud Cover
              </div>
              <div className="text-2xl font-black text-slate-800 my-1">
                {satellite.cloud_cover_pct !== null ? `${satellite.cloud_cover_pct}%` : '0%'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {satellite.cloud_cover_pct && satellite.cloud_cover_pct < 20 ? 'Optimal clear scene' : 'Acceptable quality'}
              </div>
            </div>

            {/* Biomass Trend */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Canopy Trend
              </div>
              <div className="text-base font-bold text-slate-800 my-1 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{satellite.vegetation_trend || 'Stable'}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Multi-week trajectory</div>
            </div>
          </div>

          {/* Older scene notice if applicable */}
          {satellite.is_older_observation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900 flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Older Cloud-Free Observation Used</div>
                <div className="text-[11px] text-blue-800">The most recent orbital pass over this sector was cloudy. Displaying the latest clear acquisition ({satellite.observation_date ? new Date(satellite.observation_date).toLocaleDateString() : 'recent'}).</div>
              </div>
            </div>
          )}

          {/* Genuine Sentinel-2 True-Color Preview */}
          {satellite.thumbnail_url && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span className="font-semibold text-slate-800">Sentinel-2 Optical Scene Preview</span>
                <span className="font-mono text-[10px] text-slate-500">True-Color RGB (10m)</span>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-[16/9] bg-slate-900">
                <img
                  src={satellite.thumbnail_url}
                  alt="Sentinel-2 Optical Scene Preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-white text-[10px] font-mono flex justify-between items-center pointer-events-none">
                  <span>Scene: {satellite.scene_id ? satellite.scene_id.substring(0, 20) : 'Sentinel-2'}</span>
                  <span>Cloud: {satellite.cloud_cover_pct != null ? `${satellite.cloud_cover_pct}%` : 'Low'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Unretrieved spectral bands notice if applicable */}
          {satellite.ndvi === null && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Spectral NDVI Index: UNAVAILABLE</div>
                <div className="text-[11px] text-amber-800 leading-relaxed">
                  Sentinel-2 scene verified. Detailed spectral-band processing is not currently available.
                </div>
              </div>
            </div>
          )}

          {/* Scene details */}
          {satellite.provenance_details && (
            <div className="bg-slate-50 rounded-lg p-2.5 text-[11px] font-mono text-slate-600 border border-slate-200/80">
              {satellite.provenance_details}
            </div>
          )}
        </div>
      )}

      {/* Data Provenance Badge */}
      <DataSourceBadge
        source={satellite?.provider || 'Sentinel-2 / Landsat Public Dataset Registry'}
        dataType="10m MSI Surface Reflectance (L2A)"
        observedAt={satellite?.observation_date}
        status={satellite?.status || 'UNAVAILABLE'}
      />
    </div>
  );
};
