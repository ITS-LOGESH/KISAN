import React from 'react';
import { Database, Clock, Calendar, MapPin } from 'lucide-react';

interface DataSourceBadgeProps {
  source: string;
  dataType?: string;
  retrievedAt?: string | null;
  observedAt?: string | null;
  location?: string;
  status?: string;
  isCached?: boolean;
  cachedAt?: number | string | null;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source,
  dataType,
  retrievedAt,
  observedAt,
  location,
  status = 'LIVE',
  isCached = false,
  cachedAt
}) => {
  const isLive = status === 'LIVE';
  const isAvailable = status === 'AVAILABLE';
  const isCloudy = status === 'CLOUDY';
  const isUnavailable = status === 'UNAVAILABLE';

  const isSatellite = dataType?.toLowerCase().includes('reflectance') ||
    dataType?.toLowerCase().includes('satellite') ||
    source?.toLowerCase().includes('sentinel') ||
    source?.toLowerCase().includes('landsat') ||
    Boolean(observedAt);

  const displayTime = observedAt || retrievedAt;
  const timeLabel = isSatellite ? 'OBSERVED:' : 'RETRIEVED:';

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isSatellite) {
        return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-2.5 text-xs text-slate-600 space-y-1 mt-2">
      <div className="flex items-center justify-between font-medium">
        <div className="flex items-center space-x-1.5 text-slate-800">
          <Database className="w-3.5 h-3.5 text-agri-700" />
          <span>SOURCE: <strong className="text-slate-900">{source}</strong></span>
        </div>
        {isCached ? (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-amber-100 text-amber-900 border border-amber-300">
            CACHED (OFFLINE)
          </span>
        ) : (
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
              isLive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : isAvailable
                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                : isCloudy
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {status}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-0.5">
        {dataType && (
          <div>
            DATA: <span className="text-slate-700 font-medium">{dataType}</span>
          </div>
        )}
        {displayTime && (
          <div className="flex items-center space-x-1">
            {isSatellite ? (
              <Calendar className="w-3 h-3 text-slate-400" />
            ) : (
              <Clock className="w-3 h-3 text-slate-400" />
            )}
            <span>{timeLabel} <span className="text-slate-700 font-mono">{formatDate(displayTime)}</span></span>
          </div>
        )}
        {isCached && cachedAt && (
          <div className="flex items-center space-x-1 text-amber-800 font-medium">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>LAST SAVED: <span className="font-mono">{formatDate(typeof cachedAt === 'number' ? new Date(cachedAt).toISOString() : String(cachedAt))}</span></span>
          </div>
        )}
        {location && (
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>LOC: {location}</span>
          </div>
        )}
      </div>
    </div>
  );
};
