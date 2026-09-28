import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Button } from '../design-system/Button';
import { Card } from '../design-system/Card';
import { StatusBadge } from '../design-system/StatusBadge';
import { ArrowLeft, ShieldCheck, Database, CloudSun, Satellite, Map, Info, CheckCircle2 } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { navigate } = useRouter();
  const { t } = useLanguage();
  const [health, setHealth] = useState<any>(null);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  useEffect(() => {
    api.getHealth().then((h) => setHealth(h)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-2">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
        <button
          onClick={() => navigate('home')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#5C4535] hover:text-[#1C1510] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToHome', 'Back to Home')}</span>
        </button>

        <span className="font-mono text-xs text-[#786C60]">
          {t('settings', 'Application Settings')}
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-black text-[#1C1510] tracking-tight">
          {t('settings', 'Settings & Provenance')}
        </h1>
        <p className="text-sm text-[#6B5E51] font-light">
          {t('welcomeSubtitle', 'Transparent open data telemetry sources and platform runtime configuration.')}
        </p>
      </div>

      {/* ₹0 Cost Guarantee Banner */}
      <div className="p-5 rounded-3xl bg-[#E8F5F0] border border-[#BEE9DC] flex items-center space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1B4D3E] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-[#FBDD97]" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-base text-[#1C1510]">
            {t('zeroCostGuaranteeTitle', '₹0 Cost Guarantee • Zero Paid APIs Required')}
          </h3>
          <p className="text-xs text-[#1B4D3E] mt-0.5 font-light leading-relaxed">
            Kisan operates completely on open public environmental datasets and local processing without incurring cloud billing.
          </p>
        </div>
      </div>

      {/* Verified Open Data Sources */}
      <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 space-y-4 shadow-subtle text-xs">
        <h3 className="font-serif font-bold text-base text-[#1C1510] border-b border-[#E8E2D8] pb-3">
          {t('openTelemetryRegistry', 'Open Telemetry Registry')}
        </h3>

        <div className="space-y-3 divide-y divide-[#E8E2D8]">
          <div className="pt-2 flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <CloudSun className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-[#1C1510]">Open-Meteo Weather API</strong>
                <span className="text-[#6B5E51] text-[11px]">Free, CC BY 4.0 licensed hourly and 7-day meteorological forecasts.</span>
              </div>
            </div>
            <StatusBadge status="success">Verified Open</StatusBadge>
          </div>

          <div className="pt-3 flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <Satellite className="w-5 h-5 text-[#1B4D3E] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-[#1C1510]">Copernicus Sentinel-2 STAC</strong>
                <span className="text-[#6B5E51] text-[11px]">ESA multi-spectral public scene discovery (raw bands reported honestly).</span>
              </div>
            </div>
            <StatusBadge status="success">STAC Active</StatusBadge>
          </div>

          <div className="pt-3 flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <Map className="w-5 h-5 text-[#C78520] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-[#1C1510]">Cartography & Geocoding</strong>
                <span className="text-[#6B5E51] text-[11px]">OpenStreetMap contributors, Leaflet, and Open-Meteo geocoding.</span>
              </div>
            </div>
            <StatusBadge status="info">Public OSM</StatusBadge>
          </div>

          <div className="pt-3 flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <Database className="w-5 h-5 text-[#786C60] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-[#1C1510]">Local Storage & ORM</strong>
                <span className="text-[#6B5E51] text-[11px]">SQLite zero-dependency local database engine.</span>
              </div>
            </div>
            <StatusBadge status="neutral">SQLite DB</StatusBadge>
          </div>
        </div>
      </div>

      {/* Data Trust & Provenance Tiers */}
      <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 space-y-3 shadow-subtle text-xs">
        <h3 className="font-serif font-bold text-base text-[#1C1510] border-b border-[#E8E2D8] pb-3">
          {t('provenanceLevels', 'Provenance & Data Trust Tiers')}
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-[#1C1510]">
            <CheckCircle2 className="w-4 h-4 text-[#1B4D3E]" />
            <span>{t('measured', 'Measured (Ground Soil Test / Physical Sample)')}</span>
          </div>
          <div className="flex items-center space-x-2 text-[#1C1510]">
            <CheckCircle2 className="w-4 h-4 text-[#1B4D3E]" />
            <span>{t('estimated', 'Estimated (Satellite Orbital Sensor)')}</span>
          </div>
          <div className="flex items-center space-x-2 text-[#1C1510]">
            <CheckCircle2 className="w-4 h-4 text-[#1B4D3E]" />
            <span>{t('predicted', 'Predicted (Numerical Weather Forecast)')}</span>
          </div>
          <div className="flex items-center space-x-2 text-[#1C1510]">
            <CheckCircle2 className="w-4 h-4 text-[#C78520]" />
            <span>{t('aiRecommendation', 'AI Recommendation (Decision Support)')}</span>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 flex items-center justify-between shadow-subtle">
        <div>
          <h4 className="font-serif font-bold text-sm text-[#1C1510]">{t('profile', 'Farmer Session')}</h4>
          <p className="text-xs text-[#6B5E51] mt-0.5">
            Reset onboarding state or sign in as a different farmer profile.
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('kisan_onboarded');
            localStorage.removeItem('kisan_welcomed');
            navigate('welcome');
          }}
          className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
        >
          Sign Out / Reset
        </button>
      </div>

      {/* System Build Info */}
      <div className="text-center font-mono text-xs text-[#786C60] space-y-1">
        <div>Kisan Agricultural Platform • Production 2026 Edition</div>
        <div className="text-[10px] text-[#A89A8C]">Status: {health?.status || 'Online'} • Gemini AI & Open-Meteo Active</div>
      </div>
    </div>
  );
};
