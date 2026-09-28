import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Field, WeatherData, SoilData, RiskResult, DiseaseAnalysisResult, UserProfile, FarmerAlert } from '../types';
import { localizeRiskLevel, localizeRisk, localizeAlertTitle } from '../utils/i18n';
import { FieldSatellitePreview } from '../components/FieldSatellitePreview';
import { Button } from '../design-system/Button';
import { Card } from '../design-system/Card';
import { StatusBadge } from '../design-system/StatusBadge';
import { LoadingSkeleton } from '../design-system/LoadingSkeleton';
import { ErrorState } from '../design-system/ErrorState';
import {
  Plus,
  Microscope,
  Sparkles,
  ArrowRight,
  CloudSun,
  Sprout,
  FlaskConical,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  Bell,
  ShieldCheck
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { navigate } = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [activeField, setActiveField] = useState<Field | null>(null);

  // Active field telemetry
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [risks, setRisks] = useState<RiskResult[]>([]);
  const [cropHistory, setCropHistory] = useState<DiseaseAnalysisResult[]>([]);
  const [alerts, setAlerts] = useState<FarmerAlert[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userProfile, fieldsList, alertsList] = await Promise.all([
        api.getUserProfile().catch(() => null),
        api.getFields(false).catch(() => []), // Strict rule: show real farmer fields, empty state if none
        api.getAlerts({ evaluate: false }).catch(() => []),
      ]);

      setProfile(userProfile);
      setFields(fieldsList);
      setAlerts(alertsList);

      if (fieldsList.length > 0) {
        const primary = fieldsList[0];
        setActiveField(primary);

        // Fetch telemetry for primary field
        const [wData, sData, rData, dHistory] = await Promise.all([
          api.getFieldWeather(primary.id).catch(() => null),
          api.getFieldSoil(primary.id).catch(() => null),
          api.getFieldRisks(primary.id).catch(() => []),
          api.getFieldDiseaseHistory(primary.id).catch(() => []),
        ]);

        setWeather(wData);
        setSoil(sData);
        setRisks(rData);
        setCropHistory(dHistory);
      }
    } catch (err: any) {
      console.error('Failed to load home data:', err);
      setError('Could not load farm details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalArea = fields.reduce((acc, f) => acc + (f.area_acres || 0), 0);
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 
    ? t('goodMorning', 'Good morning') 
    : currentHour < 17 
    ? t('goodAfternoon', 'Good afternoon') 
    : t('goodEvening', 'Good evening');
  const farmerGreetingName = profile?.name ? profile.name : t('farmer', 'Farmer');

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <LoadingSkeleton className="h-10 w-48" />
        <LoadingSkeleton className="h-32 w-full" />
        <LoadingSkeleton className="h-72 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <LoadingSkeleton className="h-28" />
          <LoadingSkeleton className="h-28" />
          <LoadingSkeleton className="h-28" />
          <LoadingSkeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* ================= GREETING & FARM SUMMARY ================= */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#1B4D3E] font-semibold block mb-1">
            {t('digitalFarmDashboard', 'DIGITAL FARM DASHBOARD')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#1C1510] tracking-tight">
            {greeting}, {farmerGreetingName}
          </h1>
        </div>

        {/* Farm Totals */}
        <div className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-2xl border border-[#E8E2D8] shadow-subtle text-xs">
          <div>
            <span className="text-[10px] font-mono text-[#786C60] uppercase block">{t('parcels', 'Parcels')}</span>
            <strong className="font-serif font-bold text-[#1C1510] text-base">{fields.length}</strong>
          </div>
          <span className="h-6 w-px bg-[#E8E2D8]" />
          <div>
            <span className="text-[10px] font-mono text-[#786C60] uppercase block">{t('totalArea', 'Total Area')}</span>
            <strong className="font-serif font-bold text-[#1C1510] text-base">
              {totalArea > 0 ? `${totalArea.toFixed(1)} ${t('acres', 'ac')}` : '--'}
            </strong>
          </div>
        </div>
      </div>

      {/* ================= COMPACT FARMER ALERTS ENTRY POINT ================= */}
      <div
        onClick={() => navigate('alerts')}
        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          alerts.some(a => !a.is_read)
            ? 'bg-gradient-to-r from-[#FFFAEB] via-white to-white border-[#FEDF89] shadow-subtle hover:border-[#F79009]'
            : 'bg-white border-[#E8E2D8] hover:border-[#1B4D3E]/40 hover:shadow-subtle'
        }`}
      >
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            alerts.some(a => !a.is_read)
              ? 'bg-[#FEF0C7] text-[#B54708]'
              : 'bg-[#E8F5F0] text-[#1B4D3E]'
          }`}>
            {alerts.some(a => !a.is_read) ? (
              <Bell className="w-5 h-5 text-[#B54708]" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-[#1B4D3E]" />
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-base text-[#1C1510]">
                {t('farmerAlerts', 'Farmer Alerts')}
              </span>
              {alerts.filter(a => !a.is_read).length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#B54708] text-white">
                  {alerts.filter(a => !a.is_read).length} {t('unread', 'Unread')}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5F0] text-[#1B4D3E]">
                  {t('allClear', 'All Clear')}
                </span>
              )}
            </div>

            <p className="text-xs text-[#5C4535] font-light line-clamp-1">
              {alerts.length > 0 && alerts.some(a => !a.is_read)
                ? localizeAlertTitle(alerts.find(a => !a.is_read), t)
                : t('noActiveAlertsDesc', 'All monitored environmental indicators and crop conditions are within normal limits.')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-xs font-semibold text-[#1B4D3E] self-end sm:self-auto shrink-0">
          <span>{t('viewAllAlerts', 'View Alerts')} ({alerts.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* ================= ACTIVE FIELD HERO ================= */}
      {activeField ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-mono text-[#786C60] uppercase tracking-wider font-semibold">
              {t('activeParcel', 'ACTIVE PARCEL')}
            </span>
            <button
              onClick={() => navigate('fields')}
              className="text-[#1B4D3E] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>{t('allFieldsCount', 'All Fields')} ({fields.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Real Satellite Map Parcel Centerpiece */}
          <div className="relative group bg-white rounded-[2rem] border border-[#E8E2D8] shadow-elevated p-5 sm:p-7 space-y-5">
            <FieldSatellitePreview
              cropType={activeField.crop_type}
              name={activeField.name}
              boundaryGeoJson={activeField.boundary_geojson}
              latitude={activeField.latitude}
              longitude={activeField.longitude}
              height="260px"
            />

            {/* Field Identity Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-serif font-bold text-[#1C1510] tracking-tight">
                    {activeField.name}
                  </h2>
                  <StatusBadge status="success">{t('active', 'Active')}</StatusBadge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#5C4535]">
                  <span className="font-semibold text-[#1B4D3E]">{activeField.crop_type}</span>
                  {activeField.variety && <span>({activeField.variety})</span>}
                  <span>•</span>
                  <span>{activeField.area_acres ? `${activeField.area_acres.toFixed(1)} ${t('acres', 'acres')}` : t('areaNotSet', 'Area not specified')}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 text-[#786C60]">
                    <MapPin className="w-3.5 h-3.5 text-[#C78520]" />
                    <span>{activeField.district ? `${activeField.district}, ` : ''}{activeField.state}</span>
                  </span>
                </div>
              </div>

              {/* View Field CTA */}
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('field-detail', { fieldId: activeField.id })}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="shrink-0 cursor-pointer"
              >
                {t('viewField', 'View Field')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Field State */
        <div className="p-8 sm:p-12 text-center rounded-[2rem] bg-white border border-[#E8E2D8] shadow-subtle space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F5F0] text-[#1B4D3E] flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-[#1C1510]">{t('noFieldsYet', 'No fields registered yet')}</h3>
            <p className="text-xs text-[#786C60] mt-1 max-w-sm mx-auto">
              {t('noFieldsDesc', 'Add your farm boundaries to monitor live weather telemetry, soil records, and satellite observations.')}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('add-field')}
            icon={<Plus className="w-4 h-4" />}
            className="cursor-pointer"
          >
            {t('addField', 'Add Field')}
          </Button>
        </div>
      )}

      {/* ================= QUICK ACTIONS (Easy 1-Tap on Mobile) ================= */}
      <div className="space-y-3">
        <span className="font-mono text-xs text-[#786C60] uppercase tracking-wider font-semibold block px-1">
          {t('quickActions', 'QUICK ACTIONS')}
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            onClick={() => navigate('add-field')}
            className="p-4 rounded-2xl bg-white hover:bg-[#F7F4EE] border border-[#E8E2D8] shadow-subtle flex items-center space-x-3.5 transition-all text-left cursor-pointer active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F5F0] text-[#1B4D3E] flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <strong className="block font-serif font-bold text-sm text-[#1C1510]">{t('addField', 'Add Field')}</strong>
              <span className="text-[11px] text-[#786C60] leading-none">{t('mapNewParcel', 'Map new parcel boundary')}</span>
            </div>
          </button>

          <button
            onClick={() => navigate('check-crop')}
            className="p-4 rounded-2xl bg-white hover:bg-[#F7F4EE] border border-[#E8E2D8] shadow-subtle flex items-center space-x-3.5 transition-all text-left cursor-pointer active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FEF8E7] text-[#C78520] flex items-center justify-center shrink-0">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <strong className="block font-serif font-bold text-sm text-[#1C1510]">{t('checkCrop', 'Check Crop')}</strong>
              <span className="text-[11px] text-[#786C60] leading-none">{t('screenLeafHealth', 'Screen leaf health photo')}</span>
            </div>
          </button>

          <button
            onClick={() => navigate('ask-field')}
            className="p-4 rounded-2xl bg-white hover:bg-[#F7F4EE] border border-[#E8E2D8] shadow-subtle flex items-center space-x-3.5 transition-all text-left cursor-pointer active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <strong className="block font-serif font-bold text-sm text-[#1C1510]">{t('askMyField', 'Ask My Field')}</strong>
              <span className="text-[11px] text-[#786C60] leading-none">{t('askFarmAdvice', 'Ask farm operational advice')}</span>
            </div>
          </button>
        </div>
      </div>

      {/* ================= WHAT'S HAPPENING? (Strict Data Rule Compliant) ================= */}
      <div className="space-y-3">
        <span className="font-mono text-xs text-[#786C60] uppercase tracking-wider font-semibold block px-1">
          {t('whatsHappening', "WHAT'S HAPPENING?")}
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Weather */}
          <div className="p-4 bg-white rounded-2xl border border-[#E8E2D8] shadow-subtle space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-blue-700">
                <CloudSun className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase font-bold text-[#786C60]">{t('weather', 'Weather')}</span>
              </div>
              {activeField && api.getCacheMeta(`weather_${activeField.id}`).isCached && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  {t('cachedData', 'CACHED')}
                </span>
              )}
            </div>
            <div className="font-serif font-bold text-base text-[#1C1510] pt-1">
              {weather?.temperature_c != null
                ? `${Math.round(weather.temperature_c)}°C`
                : '--'}
            </div>
            <p className="text-[11px] text-[#786C60] leading-tight">
              {weather?.precipitation_probability_pct != null
                ? `${weather.precipitation_probability_pct}% ${t('rainProb', 'rain prob')}`
                : '--'}
            </p>
          </div>

          {/* Crop */}
          <div className="p-4 bg-white rounded-2xl border border-[#E8E2D8] shadow-subtle space-y-1">
            <div className="flex items-center space-x-1.5 text-[#1B4D3E]">
              <Sprout className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase font-bold text-[#786C60]">{t('cropHealth', 'Crop Health')}</span>
            </div>
            <div className="font-serif font-bold text-base text-[#1C1510] pt-1 truncate">
              {cropHistory.length > 0
                ? cropHistory[0].detected_issue || t('normalStatus', 'Normal')
                : t('waitingAnalysis', 'Waiting for analysis')}
            </div>
            <p className="text-[11px] text-[#786C60] leading-tight">
              {cropHistory.length > 0 ? t('foliarScreened', 'Foliar screened') : t('noLeafCheck', 'No leaf check yet')}
            </p>
          </div>

          {/* Soil */}
          <div className="p-4 bg-white rounded-2xl border border-[#E8E2D8] shadow-subtle space-y-1">
            <div className="flex items-center space-x-1.5 text-[#C78520]">
              <FlaskConical className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase font-bold text-[#786C60]">{t('soil', 'Soil')}</span>
            </div>
            <div className="font-serif font-bold text-base text-[#1C1510] pt-1">
              {soil?.ph != null ? `pH ${soil.ph}` : '--'}
            </div>
            <p className="text-[11px] text-[#786C60] leading-tight truncate">
              {soil?.source_type && soil.source_type !== 'UNAVAILABLE' 
                ? (soil.source_type === 'USER_PROVIDED' || soil.source_type === 'MEASURED' ? t('labRecord', 'Lab Record') : t('regionalSoilBaseline', 'Regional Model')) 
                : t('soilDataNotAvailable', 'Soil data not available')}
            </p>
          </div>

          {/* Risk */}
          <div className="p-4 bg-white rounded-2xl border border-[#E8E2D8] shadow-subtle space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase font-bold text-[#786C60]">{t('risk', 'Risk')}</span>
            </div>
            <div className="font-serif font-bold text-base text-[#1C1510] pt-1 truncate">
              {risks.length > 0 ? `${localizeRiskLevel(risks[0].level, t)} ${t('risk', 'Risk')}` : '--'}
            </div>
            <p className="text-[11px] text-[#786C60] leading-tight truncate">
              {risks.length > 0 ? localizeRisk(risks[0], t).what_risk : t('deterministicActive', 'Deterministic engine active')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
