import React, { useState, useEffect } from 'react';
import { Field, WeatherData, SatelliteData, SoilData, RiskResult, Advisory, FarmerAlert, AlertSeverity } from '../types';
import { IndiaMap } from './IndiaMap';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { offlineCache } from '../services/offlineCache';
import {
  localizeRiskLevel,
  localizeRisk,
  localizeAdvisory,
  localizeFactor,
  localizeAlertSeverity,
  localizeAlertType,
  localizeAlertTitle,
  localizeAlertMessage,
  localizeAlertSource,
  localizeAlertAction
} from '../utils/i18n';
import {
  Sparkles,
  Microscope,
  Droplets,
  Wind,
  Thermometer,
  CloudRain,
  Satellite as SatelliteIcon,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  ArrowRight,
  Bell,
  ShieldCheck,
  CheckCheck,
  Check,
  Info
} from 'lucide-react';

interface FieldExperienceProps {
  field: Field | null;
  allFields: Field[];
  weather: WeatherData | null;
  satellite: SatelliteData | null;
  soil: SoilData | null;
  risks: RiskResult[];
  advisories: Advisory[];
  loadingTelemetry: boolean;
  onRefreshTelemetry: () => void;
  onSelectField: (field: Field) => void;
  onAskMyFieldClick: () => void;
  onCheckCropClick: () => void;
  onUploadSoilClick: () => void;
  isCached?: boolean;
  cachedAt?: number | string | null;
}

export const FieldExperience: React.FC<FieldExperienceProps> = ({
  field,
  allFields,
  weather,
  satellite,
  soil,
  risks,
  advisories,
  loadingTelemetry,
  onRefreshTelemetry,
  onSelectField,
  onAskMyFieldClick,
  onCheckCropClick,
  onUploadSoilClick,
  isCached = false,
  cachedAt
}) => {
  const { t } = useLanguage();
  const [showFullForecast, setShowFullForecast] = useState(false);
  const [fieldAlerts, setFieldAlerts] = useState<FarmerAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertsFilter, setAlertsFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!field?.id) return;
    let isMounted = true;
    setLoadingAlerts(true);
    api.getFieldAlerts(field.id, false)
      .then(data => {
        if (isMounted) setFieldAlerts(data);
      })
      .catch(err => {
        console.warn('Failed to load field alerts:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingAlerts(false);
      });
    return () => { isMounted = false; };
  }, [field?.id]);

  const handleMarkFieldAlertRead = async (alertId: number) => {
    try {
      await api.markAlertRead(alertId);
      setFieldAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    } catch (err) {
      console.warn('Failed to mark alert as read:', err);
    }
  };

  if (!field) return null;

  // Weather determinations (Strict zero-fabrication)
  const tomorrow = weather?.daily_forecast?.[1];
  const tomorrowRainProb = tomorrow?.precipitation_probability_max ?? weather?.precipitation_probability_pct ?? null;
  const tomorrowWillRain = tomorrowRainProb != null && tomorrowRainProb >= 40;
  const todayTemp = weather?.temperature_c != null ? Math.round(weather.temperature_c) : null;
  const windSpeed = weather?.wind_speed_kmh != null ? Math.round(weather.wind_speed_kmh) : null;
  const isSprayingSafe = windSpeed != null ? windSpeed < 15 && (weather?.precipitation_probability_pct ?? 0) < 30 : null;

  // Sowing date formatting
  const formattedSowingDate = field.sowing_date
    ? new Date(field.sowing_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : null;

  return (
    <section id="enter-field" className="scroll-mt-20 space-y-12 mb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
      {/* 1. FIELD HEADER — Calm, Monumental Identity */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-canvas-border pb-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-soil-500 uppercase tracking-widest font-semibold">
            <span>PARCEL 0{field.id}</span>
            <span>•</span>
            <span className="text-moss-900 font-bold">{field.crop_type}</span>
            {field.variety && <span className="text-soil-600">({field.variety})</span>}
            <span>•</span>
            <span>{field.district ? `${field.district}, ` : ''}{field.state}</span>
            {isCached && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {t('cachedData', 'CACHED (OFFLINE)')}
                  {cachedAt && (
                    <span className="text-amber-800 font-normal">
                      • {new Date(cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-soil-950 tracking-tight leading-[0.98]">
            {field.name}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-sm text-soil-600 font-light">
            <span>{field.area_acres ? `${field.area_acres.toFixed(2)} ${t('acres', 'Acres')}` : t('areaNotSet', 'Area not set')}</span>
            <span>{field.boundary_geojson ? t('cadastralBoundary', 'Cadastral Boundary Polygon') : t('boundaryNotAvailable', 'Field boundary not available')}</span>
            {formattedSowingDate && (
              <>
                <span>•</span>
                <span className="flex items-center space-x-1 text-soil-700">
                  <Calendar className="w-3.5 h-3.5 text-moss-700 inline" />
                  <span>{t('sowingDate', 'Sown on')} {formattedSowingDate}</span>
                </span>
              </>
            )}
            {field.irrigation_method && (
              <>
                <span>•</span>
                <span className="text-moss-800 font-medium">{field.irrigation_method}</span>
              </>
            )}
          </div>
        </div>

        {/* Primary Action Triggers */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onCheckCropClick}
            className="px-5 py-3 rounded-full border border-canvas-border bg-white hover:bg-canvas-100 text-soil-900 font-sans text-xs font-semibold flex items-center space-x-2 transition-all shadow-subtle cursor-pointer"
          >
            <Microscope className="w-4 h-4 text-moss-700" />
            <span>{t('checkCrop', 'Check Crop')}</span>
          </button>

          <button
            onClick={onAskMyFieldClick}
            className="px-6 py-3 rounded-full bg-moss-800 hover:bg-moss-900 text-white font-sans text-xs font-semibold flex items-center space-x-2 transition-all shadow-elevated cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-harvest-300" />
            <span>{t('askMyField', 'Ask My Field')}</span>
          </button>
        </div>
      </div>

      {/* 2. FIELD VISUAL — The Map as the Dominant Hero */}
      <div className="space-y-4">
        <div className="relative rounded-3xl overflow-hidden border border-canvas-border shadow-elevated bg-[#E8E2D8]">
          <IndiaMap
            fields={allFields}
            selectedField={field}
            onSelectField={onSelectField}
            height="580px"
            showBoundaryPolygons={true}
          />
        </div>

        {/* Quiet Telemetry Grounding Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-soil-500 px-2">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-medium text-soil-800">
              Centroid: {field.latitude.toFixed(4)}° N, {field.longitude.toFixed(4)}° E
            </span>
          </div>

          <div className="flex items-center space-x-3 text-soil-600">
            <span>
              Copernicus STAC: <strong className="text-soil-900">{satellite?.scene_id ? satellite.scene_id.substring(0, 20) : 'Available'}</strong>
            </span>
            <span>•</span>
            <span>
              Soil Source: <strong className="text-soil-900">{soil?.source_type && soil.source_type !== 'UNAVAILABLE' ? (soil.source_type === 'USER_PROVIDED' || soil.source_type === 'MEASURED' ? t('labRecord', 'Lab Record') : t('regionalSoilBaseline', 'Regional Model')) : t('regionalSoilBaseline', 'Regional Model')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. "WHAT'S HAPPENING" — Actionable Agronomic Summary */}
      <div className="bg-white rounded-3xl border border-canvas-border shadow-elevated p-8 sm:p-12 space-y-8">
        <div className="flex items-center justify-between text-xs font-mono text-soil-400 uppercase tracking-widest border-b border-canvas-border pb-4">
          <span>{t('whatsHappeningInField', "WHAT'S HAPPENING IN YOUR FIELD")}</span>
          <span>{t('realEnvironmentalData', 'REAL ENVIRONMENTAL DATA')}</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <div className="font-mono text-xs tracking-widest uppercase font-bold text-harvest-600">
            {t('immediateOutlook', 'IMMEDIATE OUTLOOK')} • {tomorrowWillRain ? t('rainExpectedTomorrow', 'RAIN FORECAST') : t('noRainExpected', 'CLEAR & STABLE ATMOSPHERE')}
          </div>

          <h3 className="text-3xl sm:text-5xl font-serif font-normal text-soil-950 leading-[1.08]">
            {tomorrowWillRain ? (
              <>
                {t('rainExpectedTomorrow', 'Rain is forecast for tomorrow.')}<br />
                <span className="italic font-serif text-soil-600">"{t('delayIrrigationQuote', 'You may want to delay scheduled irrigation.')}"</span>
              </>
            ) : (
              <>
                {t('noRainExpected', 'Skies are stable and clear.')}<br />
                <span className="italic font-serif text-soil-600">"{t('favorableIrrigationQuote', 'Favorable conditions for scheduled irrigation & feeding.')}"</span>
              </>
            )}
          </h3>

          <p className="text-base text-soil-700 font-light leading-relaxed">
            {tomorrowWillRain
              ? t('rainDelayExplanation', `Precipitation probability reaches ${tomorrowRainProb}%. Delaying water delivery conserves borewell energy and prevents waterlogging in ${field.crop_type} root zones.`)
                  .replace('{prob}', String(tomorrowRainProb ?? ''))
                  .replace('{crop}', field.crop_type || '')
              : tomorrowRainProb != null
              ? t('stableSkiesExplanation', `Precipitation probability remains low (${tomorrowRainProb}%). Daytime temperatures (${todayTemp != null ? todayTemp + '°C' : '--'}) favor regular crop water uptake and timely field work.`)
                  .replace('{prob}', String(tomorrowRainProb ?? ''))
                  .replace('{temp}', todayTemp != null ? `${todayTemp}°C` : '--')
              : t('openMeteoActive', `Open-Meteo environmental telemetry active for ${field.crop_type}.`)
                  .replace('{crop}', field.crop_type || '')}
          </p>
        </div>

        {/* Three Grounded Micro-Cards: Spraying Window, Satellite, Soil */}
        <div className="pt-6 border-t border-canvas-border grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-soil-700">
          <div className="p-4 bg-canvas-100 rounded-2xl border border-canvas-border space-y-1">
            <span className="font-mono text-soil-400 uppercase block text-[10px] font-semibold">{t('agrochemicalWindow', 'Agrochemical Window')}</span>
            <strong className="text-soil-950 font-serif text-base block">
              {isSprayingSafe === true ? t('windowSafe', 'Window Safe') : isSprayingSafe === false ? t('sprayCaution', 'Spray Caution') : t('telemetryPending', 'Telemetry Pending')}
            </strong>
            <p className="text-soil-600 text-[11px]">
              {isSprayingSafe === true
                ? t('windGentleDesc', `Wind is gentle (${windSpeed} km/h). Low drift hazard.`).replace('{speed}', String(windSpeed ?? ''))
                : isSprayingSafe === false
                ? t('windCautionDesc', `Wind velocity (${windSpeed} km/h) or moisture may cause drift.`).replace('{speed}', String(windSpeed ?? ''))
                : t('windPendingDesc', 'Wind velocity and drift hazard pending live reading.')}
            </p>
          </div>

          <div className="p-4 bg-canvas-100 rounded-2xl border border-canvas-border space-y-1">
            <span className="font-mono text-soil-400 uppercase block text-[10px] font-semibold">{t('fieldFromAbove', 'Field from Above')}</span>
            <strong className="text-soil-950 font-serif text-base block">
              Sentinel-2 STAC
            </strong>
            <p className="text-soil-600 text-[11px]">
              {satellite?.cloud_cover_pct != null ? `${Math.round(satellite.cloud_cover_pct)}% ${t('cloudCover', 'Cloud Cover')}` : t('stacActive', 'STAC Active')}. {t('ndviUncalculatedLocally', 'NDVI uncalculated locally.')}
            </p>
          </div>

          <div className="p-4 bg-canvas-100 rounded-2xl border border-canvas-border space-y-1">
            <span className="font-mono text-soil-400 uppercase block text-[10px] font-semibold">{t('soilProfile', 'Soil Profile')}</span>
            <strong className="text-soil-950 font-serif text-base block">
              {soil?.ph ? `pH ${soil.ph} • ${soil.texture || t('loam', 'Loam')}` : t('regionalSoilBaseline', 'Regional Soil Baseline')}
            </strong>
            <p className="text-soil-600 text-[11px]">
              {soil?.source_name || (soil ? t('regionalSoilBaselineDesc', 'Regional agronomic baseline.') : t('noSoilTestYet', 'No soil test added yet.'))}
            </p>
          </div>
        </div>
      </div>

      {/* 3.5 PARCEL ALERTS — Real-time telemetry, risk & observation notifications */}
      <div className="bg-white rounded-3xl border border-canvas-border shadow-elevated p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-canvas-border pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-canvas-100 text-moss-900 border border-canvas-border">
              <Bell className="w-5 h-5 text-moss-900" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-soil-950 text-xl tracking-tight">
                  {t('fieldAlerts', 'Field Alerts')}
                </h3>
                {fieldAlerts.filter(a => !a.is_read).length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#B54708] text-white">
                    {fieldAlerts.filter(a => !a.is_read).length} {t('unread', 'Unread')}
                  </span>
                )}
              </div>
              <p className="text-xs text-soil-500 font-light mt-0.5">
                {t('fieldAlertsDesc', 'Real-time sensor, weather, and satellite notifications for this parcel.')}
              </p>
            </div>
          </div>

          {fieldAlerts.length > 0 && (
            <div className="flex items-center bg-canvas-100 p-1 rounded-xl border border-canvas-border self-start sm:self-auto text-xs">
              <button
                onClick={() => setAlertsFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  alertsFilter === 'all'
                    ? 'bg-white text-soil-950 shadow-subtle'
                    : 'text-soil-600 hover:text-soil-950'
                }`}
              >
                {t('filterAll', 'All')} ({fieldAlerts.length})
              </button>
              <button
                onClick={() => setAlertsFilter('unread')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  alertsFilter === 'unread'
                    ? 'bg-white text-soil-950 shadow-subtle'
                    : 'text-soil-600 hover:text-soil-950'
                }`}
              >
                {t('filterUnread', 'Unread')} ({fieldAlerts.filter(a => !a.is_read).length})
              </button>
            </div>
          )}
        </div>

        {/* Alerts Content */}
        {fieldAlerts.length === 0 ? (
          <div className="p-6 bg-canvas-100/50 rounded-2xl border border-canvas-border flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-800" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-soil-950 text-base">
                {t('noActiveAlerts', 'No active alerts')}
              </h4>
              <p className="text-xs text-soil-600 font-light leading-relaxed">
                {t('noActiveAlertsDesc', 'All monitored environmental indicators and crop conditions are within normal limits.')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {fieldAlerts
              .filter(a => alertsFilter === 'all' || !a.is_read)
              .map((alert) => {
                const isWarning = alert.severity === 'warning';
                const isAttention = alert.severity === 'attention';
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      alert.is_read
                        ? 'bg-canvas-100/40 border-canvas-border opacity-90'
                        : isWarning
                        ? 'bg-[#FEF3F2]/50 border-[#FECDCA] shadow-subtle'
                        : isAttention
                        ? 'bg-[#FFFAEB]/60 border-[#FEDF89] shadow-subtle'
                        : 'bg-[#F0F9FF]/50 border-[#B9E6FE] shadow-subtle'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isWarning
                              ? 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
                              : isAttention
                              ? 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]'
                              : 'bg-[#F0F9FF] text-[#026AA2] border border-[#B9E6FE]'
                          }`}>
                            {isWarning ? (
                              <AlertTriangle className="w-3 h-3 text-[#D92D20]" />
                            ) : isAttention ? (
                              <AlertTriangle className="w-3 h-3 text-[#F79009]" />
                            ) : (
                              <Info className="w-3 h-3 text-[#0BA5EC]" />
                            )}
                            <span>{localizeAlertSeverity(alert.severity, t)}</span>
                          </span>

                          <span className="text-[11px] font-mono text-soil-500">
                            {localizeAlertType(alert.type, t)}
                          </span>

                          <span className="text-[11px] font-mono text-soil-400 ml-auto">
                            {new Date(alert.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-soil-950 text-base">
                          {localizeAlertTitle(alert, t)}
                        </h4>

                        <p className="text-xs text-soil-700 font-light leading-relaxed">
                          {localizeAlertMessage(alert, t)}
                        </p>
                      </div>

                      {!alert.is_read && (
                        <button
                          onClick={() => handleMarkFieldAlertRead(alert.id)}
                          title={t('markAsRead', 'Mark as read')}
                          className="p-1.5 text-soil-500 hover:text-moss-900 hover:bg-canvas-200/60 rounded-full transition-colors cursor-pointer shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {alert.action && (
                      <div className="p-3 bg-white/80 rounded-xl border border-canvas-border text-xs text-soil-800 space-y-0.5">
                        <span className="font-mono text-[10px] uppercase font-bold text-moss-900 block">
                          {t('recommendedAction', 'Recommended Action')}:
                        </span>
                        <p className="font-medium text-soil-900">{localizeAlertAction(alert, t)}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-soil-500 pt-1 border-t border-canvas-border/50">
                      <span>{t('source', 'Source')}: <strong className="text-soil-800">{localizeAlertSource(alert.source, t)}</strong></span>
                      {alert.data_provenance && <span>{alert.data_provenance}</span>}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 4. PROGRESSIVE CONDITIONS: WEATHER, SOIL, SATELLITE, RISKS & ADVISORY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* WEATHER — Calm & Grounded */}
        <div className="bg-white rounded-3xl p-8 border border-canvas-border shadow-elevated space-y-6">
          <div className="flex items-center justify-between border-b border-canvas-border pb-4">
            <div className="flex items-center space-x-2">
              <CloudRain className="w-4 h-4 text-moss-800" />
              <h4 className="font-serif font-bold text-soil-950 text-xl">{t('weatherAndTrajectory', 'Weather & Trajectory')}</h4>
            </div>
            <div className="flex items-center gap-2">
              {isCached && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {t('cachedData', 'CACHED')}
                </span>
              )}
              <span className="text-[11px] font-mono text-soil-400 uppercase">{t('openMeteoVerified', 'Open-Meteo Verified')}</span>
            </div>
          </div>

          {/* Current Day Triad */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-canvas-100 rounded-2xl border border-canvas-border">
              <div className="flex items-center justify-center space-x-1 text-soil-500 mb-1">
                <Thermometer className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono uppercase">{t('temp', 'Temp')}</span>
              </div>
              <div className="font-serif font-bold text-2xl text-soil-950">
                {todayTemp != null ? `${todayTemp}°C` : '--'}
              </div>
            </div>

            <div className="p-3 bg-canvas-100 rounded-2xl border border-canvas-border">
              <div className="flex items-center justify-center space-x-1 text-soil-500 mb-1">
                <Droplets className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono uppercase">{t('rain', 'Rain')}</span>
              </div>
              <div className="font-serif font-bold text-2xl text-blue-700">
                {weather?.precipitation_probability_pct != null ? `${weather.precipitation_probability_pct}%` : '--'}
              </div>
            </div>

            <div className="p-3 bg-canvas-100 rounded-2xl border border-canvas-border">
              <div className="flex items-center justify-center space-x-1 text-soil-500 mb-1">
                <Wind className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono uppercase">{t('wind', 'Wind')}</span>
              </div>
              <div className="font-serif font-bold text-2xl text-soil-950">
                {windSpeed != null ? `${windSpeed} km/h` : '--'}
              </div>
            </div>
          </div>

          {/* 5-Day Daily Forecast Strip */}
          {weather?.daily_forecast && weather.daily_forecast.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-soil-500 font-semibold block">
                {t('fiveDayHorizon', '5-Day Horizon')}
              </span>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {weather.daily_forecast.slice(0, 5).map((d, i) => (
                  <div key={i} className="p-2 bg-canvas-100 rounded-xl border border-canvas-border space-y-0.5">
                    <span className="font-mono text-[10px] text-soil-500 font-bold block">
                      {i === 0 ? t('today', 'Today') : i === 1 ? t('tomorrow', 'Tmrw') : new Date(d.date).toLocaleDateString('en-IN', { weekday: 'narrow' })}
                    </span>
                    <span className="font-serif font-bold text-soil-900 block text-xs">
                      {Math.round(d.temp_max)}°
                    </span>
                    <span className="font-mono text-[10px] text-blue-700 font-semibold block">
                      {d.precipitation_probability_max}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SOIL — Simple Measured Profile or Upload Report Prompt */}
        <div className="bg-white rounded-3xl p-8 border border-canvas-border shadow-elevated space-y-6">
          <div className="flex items-center justify-between border-b border-canvas-border pb-4">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-4 h-4 text-harvest-600" />
              <h4 className="font-serif font-bold text-soil-950 text-xl">{t('soilProfile', 'Soil Profile')}</h4>
            </div>
            <span className="text-[11px] font-mono text-soil-400 uppercase">
              {soil?.source_type && soil.source_type !== 'UNAVAILABLE' ? (soil.source_type === 'USER_PROVIDED' || soil.source_type === 'MEASURED' ? t('labRecord', 'Lab Record') : t('regionalSoilBaseline', 'Baseline')) : t('regionalSoilBaseline', 'Baseline')}
            </span>
          </div>

          {soil && soil.ph ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-canvas-100 rounded-2xl border border-canvas-border">
                  <span className="font-mono text-[10px] text-soil-500 uppercase block mb-1">pH</span>
                  <span className="font-serif font-bold text-2xl text-soil-950">{soil.ph}</span>
                  <span className="text-[10px] text-soil-500 block mt-0.5">
                    {soil.ph < 6.5 ? t('acidic', 'Acidic') : soil.ph > 7.5 ? t('alkaline', 'Alkaline') : t('optimal', 'Optimal')}
                  </span>
                </div>

                <div className="p-3 bg-canvas-100 rounded-2xl border border-canvas-border">
                  <span className="font-mono text-[10px] text-soil-500 uppercase block mb-1">{t('nitrogen', 'Nitrogen')}</span>
                  <span className="font-serif font-bold text-lg text-soil-950">
                    {soil.nitrogen_kg_ha != null ? `${Math.round(soil.nitrogen_kg_ha)}` : '--'}
                  </span>
                  <span className="text-[10px] text-soil-500 block mt-0.5">
                    {soil.nitrogen_kg_ha != null ? 'kg/ha' : t('notRecorded', 'Not recorded')}
                  </span>
                </div>

                <div className="p-3 bg-canvas-100 rounded-2xl border border-canvas-border">
                  <span className="font-mono text-[10px] text-soil-500 uppercase block mb-1">{t('phosphorus', 'Phosphorus')}</span>
                  <span className="font-serif font-bold text-lg text-soil-950">
                    {soil.phosphorus_kg_ha != null ? `${Math.round(soil.phosphorus_kg_ha)}` : '--'}
                  </span>
                  <span className="text-[10px] text-soil-500 block mt-0.5">
                    {soil.phosphorus_kg_ha != null ? 'kg/ha' : t('notRecorded', 'Not recorded')}
                  </span>
                </div>

                <div className="p-3 bg-canvas-100 rounded-2xl border border-canvas-border">
                  <span className="font-mono text-[10px] text-soil-500 uppercase block mb-1">{t('potassium', 'Potassium')}</span>
                  <span className="font-serif font-bold text-lg text-soil-950">
                    {soil.potassium_kg_ha != null ? `${Math.round(soil.potassium_kg_ha)}` : '--'}
                  </span>
                  <span className="text-[10px] text-soil-500 block mt-0.5">
                    {soil.potassium_kg_ha != null ? 'kg/ha' : t('notRecorded', 'Not recorded')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-soil-600 pt-2 border-t border-canvas-border">
                <span>{t('texture', 'Texture')}: <strong>{soil.texture || t('clayLoam', 'Clay Loam')}</strong></span>
                <span>{t('source', 'Source')}: <strong>{soil.source_name || t('labRecord', 'Lab Record')}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-canvas-100 rounded-2xl border border-dashed border-canvas-border text-center space-y-3">
              <FlaskConical className="w-8 h-8 text-soil-400 mx-auto" />
              <div>
                <p className="font-serif font-semibold text-soil-900 text-sm">
                  {t('soilReportNotAddedYet', "Your soil report hasn't been added yet.")}
                </p>
                <p className="text-xs text-soil-500 font-light mt-1 max-w-sm mx-auto">
                  {t('soilReportNotAddedDesc', 'Adding your soil test parameters (pH, N, P, K) enables customized fertilizer and nutrient guidance.')}
                </p>
              </div>
              <button
                onClick={onUploadSoilClick}
                className="px-4 py-2 rounded-full bg-soil-900 hover:bg-soil-950 text-white font-sans text-xs font-medium inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{t('uploadSoilReport', 'Upload Soil Report')}</span>
              </button>
            </div>
          )}
        </div>

        {/* SATELLITE — FIELD FROM ABOVE (Strictly Zero Fabrication) */}
        <div className="bg-white rounded-3xl p-8 border border-canvas-border shadow-elevated space-y-6">
          <div className="flex items-center justify-between border-b border-canvas-border pb-4">
            <div className="flex items-center space-x-2">
              <SatelliteIcon className="w-4 h-4 text-cyan-800" />
              <h4 className="font-serif font-bold text-soil-950 text-xl">{t('fieldFromAbove', 'Field from Above')}</h4>
            </div>
            <span className="text-[11px] font-mono text-soil-400 uppercase">Sentinel-2 STAC</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-canvas-100 rounded-2xl border border-canvas-border space-y-1">
                <span className="font-mono text-[10px] text-soil-500 uppercase block">{t('observationDate', 'Observation Date')}</span>
                <span className="font-serif font-bold text-base text-soil-950 block">
                  {satellite?.observation_date
                    ? new Date(satellite.observation_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '--'}
                </span>
                <span className="text-[10px] text-soil-500 block">Copernicus Sentinel-2</span>
              </div>

              <div className="p-4 bg-canvas-100 rounded-2xl border border-canvas-border space-y-1">
                <span className="font-mono text-[10px] text-soil-500 uppercase block">{t('cloudCoverage', 'Cloud Coverage')}</span>
                <span className="font-serif font-bold text-base text-soil-950 block">
                  {satellite?.cloud_cover_pct != null ? `${Math.round(satellite.cloud_cover_pct)}%` : '--'}
                </span>
                <span className="text-[10px] text-soil-500 block">{t('fieldParcelPolygon', 'Field Parcel Polygon')}</span>
              </div>
            </div>

            {/* Genuine Copernicus Sentinel-2 Optical Pass Preview */}
            {satellite?.thumbnail_url ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-soil-500 uppercase tracking-wider font-semibold">
                    {t('sentinel2ScenePreview', 'SENTINEL-2 OPTICAL SCENE PREVIEW')}
                  </span>
                  <span className="font-mono text-[10px] text-soil-500">
                    True-Color RGB (10m)
                  </span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-canvas-border bg-slate-900 aspect-video sm:aspect-[21/9]">
                  <img
                    src={satellite.thumbnail_url}
                    alt="Copernicus Sentinel-2 True Color Optical Preview"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-mono pointer-events-none">
                    <span>Scene: {satellite.scene_id ? satellite.scene_id.substring(0, 24) : 'Copernicus L2A'}</span>
                    <span>Cloud: {satellite.cloud_cover_pct != null ? `${Math.round(satellite.cloud_cover_pct)}%` : 'Low'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-canvas-100 rounded-xl border border-canvas-border text-[11px] font-mono text-soil-500">
                {t('satelliteSceneNotAvailable', 'Satellite scene preview: Not available for current pass')}
              </div>
            )}

            {/* Strict Honest NDVI State — Never Fabricate NDVI Numbers */}
            <div className="p-4 bg-moss-50/60 rounded-2xl border border-moss-200/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-moss-900 text-sm">{t('ndviVegetationStatus', 'NDVI Vegetation Status')}</span>
                <span className="font-mono text-[10px] uppercase font-bold text-soil-600 bg-white px-2 py-0.5 rounded border border-moss-200">
                  {satellite?.ndvi !== null && satellite?.ndvi !== undefined ? satellite.ndvi.toFixed(2) : t('unavailable', 'Unavailable')}
                </span>
              </div>
              <p className="text-moss-900 text-[11px] leading-relaxed">
                {t('sentinel2VerifiedNotice', 'Sentinel-2 scene verified. Detailed spectral-band processing is not currently available.')}
              </p>
              <div className="text-[10px] font-mono text-soil-500 pt-0.5">
                {t('spectralBandsNotRetrieved', 'Spectral Bands: Not retrieved • Zero-cost raw metadata verification')}
              </div>
            </div>
          </div>
        </div>

        {/* FIELD RISKS — Calm, Prioritized Matrix */}
        <div className="bg-white rounded-3xl p-8 border border-canvas-border shadow-elevated space-y-6">
          <div className="flex items-center justify-between border-b border-canvas-border pb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="font-serif font-bold text-soil-950 text-xl">{t('fieldRisks', 'Field Risks')}</h4>
            </div>
            <span className="text-[11px] font-mono text-soil-400 uppercase">{t('deterministicEngine', 'Deterministic Engine')}</span>
          </div>

          {risks && risks.length > 0 ? (
            <div className="space-y-3">
              {risks.slice(0, 3).map((r, idx) => {
                const loc = localizeRisk(r, t);
                return (
                  <div key={idx} className="p-4 bg-canvas-100 rounded-2xl border border-canvas-border space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-soil-950 text-sm">{loc.what_risk}</span>
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        r.level === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : r.level === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {localizeRiskLevel(r.level, t)} {t('risk', 'Risk')}
                      </span>
                    </div>
                    <p className="text-soil-700 text-xs leading-relaxed">{loc.why_evidence}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-canvas-100 rounded-2xl border border-canvas-border text-center text-xs text-soil-600 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-serif font-semibold text-soil-900">{t('noElevatedHazards', 'No elevated agricultural hazards detected.')}</p>
              <p className="text-[11px] text-soil-500">{t('seasonalMarginsNotice', 'Weather, soil and thermal parameters remain within seasonal margins.')}</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. ADVISORY — What Your Field May Need Next */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-canvas-border shadow-elevated space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-canvas-border pb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-moss-800 font-semibold block mb-1">
              {t('actionableAgriAdvice', 'ACTIONABLE AGRICULTURAL ADVICE')}
            </span>
            <h3 className="font-serif font-bold text-3xl sm:text-4xl text-soil-950">
              {t('whatFieldNeedsNext', 'What your field may need next')}
            </h3>
          </div>

          <span className="text-xs font-mono text-soil-500">
            {t('formulatedFor', 'Formulated for')} {field.crop_type} ({field.name})
          </span>
        </div>

        {advisories && advisories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advisories.map((adv, idx) => {
              const loc = localizeAdvisory(adv, t);
              return (
                <div
                  key={idx}
                  className="p-6 bg-canvas-100 rounded-2xl border border-canvas-border flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-soil-500 uppercase tracking-wider font-semibold">{loc.category}</span>
                      <span className="text-moss-800 font-bold uppercase">{loc.priority} {t('priority', 'PRIORITY')}</span>
                    </div>

                    <h5 className="font-serif font-bold text-soil-950 text-lg leading-snug">
                      {loc.title}
                    </h5>

                    <p className="text-xs text-soil-700 font-light leading-relaxed">
                      {loc.recommendation}
                    </p>
                  </div>

                  {adv.factors_used && adv.factors_used.length > 0 && (
                    <div className="pt-3 border-t border-canvas-border text-[10px] font-mono text-soil-500 space-y-0.5">
                      <span className="font-semibold text-soil-600">{t('basedOn', 'Based on')}:</span>
                      {adv.factors_used.map((f, i) => (
                        <div key={i}>• {localizeFactor(f, t)}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-canvas-100 rounded-2xl border border-canvas-border text-center text-xs text-soil-600 space-y-2">
            <p className="font-serif font-semibold text-soil-900 text-sm">
              {t('standardProtocolActive', 'Standard seasonal management protocol active.')}
            </p>
            <p className="text-soil-500 font-light max-w-md mx-auto">
              {t('standardProtocolDesc', 'Maintain regular irrigation intervals and inspect leaves for emerging foliar lesions or pest egg clutches.')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
