import React, { useState, useEffect } from 'react';
import {
  Field as FieldType, WeatherData, SatelliteData, SoilData,
  RiskResult, Advisory, CropSuitability, RegenerativeGuidance
} from '../types';
import { api } from '../services/api';
import { IndiaMap } from '../components/IndiaMap';
import { WeatherCard } from '../components/WeatherCard';
import { SatelliteCard } from '../components/SatelliteCard';
import { SoilCard } from '../components/SoilCard';
import { RiskCard } from '../components/RiskCard';
import { AdvisoryCard } from '../components/AdvisoryCard';
import { AskField } from '../components/AskField';
import { DemoBadge } from '../components/DemoBadge';
import {
  Sprout, Calendar, MapPin, Sparkles, RefreshCw,
  Leaf, CheckCircle2, Layers, CheckSquare, ShieldAlert
} from 'lucide-react';

interface FieldPageProps {
  fieldId: number;
  onSelectFieldId: (id: number) => void;
}

export const Field: React.FC<FieldPageProps> = ({ fieldId, onSelectFieldId }) => {
  const [field, setField] = useState<FieldType | null>(null);
  const [allFields, setAllFields] = useState<FieldType[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [satellite, setSatellite] = useState<SatelliteData | null>(null);
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [risks, setRisks] = useState<RiskResult[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [cropSuitability, setCropSuitability] = useState<CropSuitability[]>([]);
  const [regenerative, setRegenerative] = useState<RegenerativeGuidance[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'telemetry' | 'crops' | 'regenerative' | 'advisories' | 'ask'>('telemetry');

  const loadFieldData = async () => {
    setLoading(true);
    try {
      const [fData, allF, wData, sData, soilData, rData, aData, cData, regData] = await Promise.all([
        api.getField(fieldId),
        api.getFields(true),
        api.getFieldWeather(fieldId),
        api.getFieldSatellite(fieldId),
        api.getFieldSoil(fieldId),
        api.getFieldRisks(fieldId),
        api.getFieldAdvisories(fieldId),
        api.getCropSuitability(fieldId),
        api.getRegenerativeGuidance(fieldId)
      ]);

      setField(fData);
      setAllFields(allF);
      setWeather(wData);
      setSatellite(sData);
      setSoil(soilData);
      setRisks(rData);
      setAdvisories(aData);
      setCropSuitability(cData);
      setRegenerative(regData);
    } catch (err) {
      console.error('Failed to load full digital twin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFieldData();
  }, [fieldId]);

  if (!field && !loading) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-600 text-xs">
        Field profile not found.
      </div>
    );
  }

  // Days after sowing
  let daysAfterSowing = null;
  if (field?.sowing_date) {
    const diffTime = Math.abs(new Date().getTime() - new Date(field.sowing_date).getTime());
    daysAfterSowing = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6">
      {/* 1. FIELD HEADER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                FIELD ID #{field?.id}
              </span>
              {field?.is_demo ? (
                <DemoBadge label={field.demo_label || 'DEMO FIELD'} size="md" />
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded border border-emerald-300">
                  USER FIELD
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">{field?.name}</h1>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {field?.district ? `${field.district}, ` : ''}{field?.state} • Coordinates: {field?.latitude.toFixed(4)}, {field?.longitude.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Quick field switcher dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-500 font-medium">Switch Field:</label>
            <select
              value={fieldId}
              onChange={(e) => onSelectFieldId(parseInt(e.target.value))}
              className="border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 bg-slate-50 focus:ring-1 focus:ring-agri-600"
            >
              {allFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.crop_type})
                </option>
              ))}
            </select>
            <button
              onClick={loadFieldData}
              title="Refresh Telemetry"
              className="p-2 text-slate-600 hover:text-slate-900 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overview Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 block font-medium">Crop Specimen</span>
            <span className="text-sm font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
              <Sprout className="w-4 h-4 text-agri-600 shrink-0" />
              <span>{field?.crop_type}</span>
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 block font-medium">Cultivated Area</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {field?.area_acres ? `${field.area_acres} Acres` : 'Not recorded'}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 block font-medium">Phenology / Sowing</span>
            <span className="text-sm font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{daysAfterSowing ? `Day ${daysAfterSowing} Post-Sow` : 'Recent sowing'}</span>
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 block font-medium">Profile Synchronized</span>
            <span className="text-sm font-bold text-emerald-800 mt-0.5 block">
              Live Verified
            </span>
          </div>
        </div>
      </div>

      {/* SECTION SELECTOR TABS */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveSection('telemetry')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeSection === 'telemetry'
              ? 'border-agri-700 text-agri-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Core Telemetry & Risks</span>
        </button>

        <button
          onClick={() => setActiveSection('crops')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeSection === 'crops'
              ? 'border-agri-700 text-agri-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Crop Suitability Engine</span>
        </button>

        <button
          onClick={() => setActiveSection('regenerative')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeSection === 'regenerative'
              ? 'border-agri-700 text-agri-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Leaf className="w-4 h-4" />
          <span>Regenerative Agriculture</span>
        </button>

        <button
          onClick={() => setActiveSection('advisories')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeSection === 'advisories'
              ? 'border-agri-700 text-agri-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Advisories ({advisories.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('ask')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeSection === 'ask'
              ? 'border-agri-700 text-agri-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Ask My Field</span>
        </button>
      </div>

      {/* SECTION 1: CORE TELEMETRY & RISKS */}
      {activeSection === 'telemetry' && (
        <div className="space-y-6">
          {/* Map Location */}
          {field && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span className="font-bold text-slate-900">Geospatial Plot Location</span>
                <span className="font-mono text-slate-700">{field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}</span>
              </div>
              <IndiaMap
                fields={[field]}
                selectedField={field}
                onSelectField={() => {}}
                height="320px"
              />
            </div>
          )}

          {/* Weather & Satellite */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeatherCard weather={weather} loading={loading} isDemo={field?.is_demo} />
            <SatelliteCard satellite={satellite} loading={loading} />
          </div>

          {/* Soil & Risk Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SoilCard
              fieldId={fieldId}
              soil={soil}
              loading={loading}
              onSoilUpdated={loadFieldData}
            />
            <RiskCard risks={risks} loading={loading} />
          </div>
        </div>
      )}

      {/* SECTION 2: CROP SUITABILITY ENGINE */}
      {activeSection === 'crops' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sprout className="w-4 h-4 text-agri-700" />
              <span>Transparent Crop Suitability Engine</span>
            </h3>
            <p className="text-xs text-slate-500">
              Evaluates agronomic compatibility against regional agro-climatic requirements for Indian crops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cropSuitability.map((crop, idx) => {
              const isHigh = crop.suitability === 'HIGH';
              const isMod = crop.suitability === 'MODERATE';
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50 hover:bg-white transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{crop.crop_name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase ${
                        isHigh
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isMod
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {crop.suitability} SUITABILITY
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-100 leading-relaxed">
                    {crop.rationale}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                    <div>
                      <span className="text-slate-400">Temp Rating: </span>
                      <span className="font-medium text-slate-800">{crop.temperature_score}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Soil Fit: </span>
                      <span className="font-medium text-slate-800">{crop.soil_score}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
                    <div>
                      <strong className="text-slate-700">FACTORS USED:</strong> {crop.factors_used.join(', ')}
                    </div>
                    <div>
                      <strong className="text-slate-700">LIMITATIONS:</strong> {crop.limitations}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: REGENERATIVE AGRICULTURE */}
      {activeSection === 'regenerative' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Leaf className="w-4 h-4 text-agri-700" />
              <span>Regenerative Agriculture Advisory Module</span>
            </h3>
            <p className="text-xs text-slate-500">
              Rigorous separation of General Agricultural Principles from Field-Specific Recommendations based on verified soil records.
            </p>
          </div>

          <div className="space-y-4">
            {regenerative.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50 hover:bg-white transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="font-bold text-slate-900 text-sm">{item.topic}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      General Agricultural Guidance
                    </span>
                    <p className="text-slate-700 leading-relaxed">{item.general_guidance}</p>
                  </div>

                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Field-Specific Recommendation
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {item.field_specific_recommendation}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-100">
                  <div>
                    <strong className="text-slate-700">Soil Benefit:</strong> {item.soil_benefit}
                  </div>
                  <div>
                    <strong className="text-slate-700">Water Benefit:</strong> {item.water_benefit}
                  </div>
                  <div>
                    <strong className="text-slate-700">Scientific Reference:</strong> {item.data_backing}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: ADVISORIES */}
      {activeSection === 'advisories' && (
        <AdvisoryCard advisories={advisories} loading={loading} />
      )}

      {/* SECTION 5: ASK MY FIELD */}
      {activeSection === 'ask' && (
        <AskField fieldId={fieldId} fieldName={field?.name || 'Field'} />
      )}
    </div>
  );
};
