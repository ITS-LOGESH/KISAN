import React, { useState } from 'react';
import { WeatherData, Field, SatelliteData, SoilData, RiskResult } from '../types';
import { ChevronDown, ChevronUp, Droplets, Wind, Thermometer, AlertCircle, ShieldAlert } from 'lucide-react';

interface WeatherStoryProps {
  weather: WeatherData | null;
  field: Field | null;
  satellite?: SatelliteData | null;
  soil?: SoilData | null;
  risks?: RiskResult[];
}

export const WeatherStory: React.FC<WeatherStoryProps> = ({
  weather,
  field,
  satellite,
  soil,
  risks = []
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  if (!field || !weather) return null;

  const tomorrow = weather.daily_forecast?.[1];
  const tomorrowRainProb = tomorrow?.precipitation_probability_max ?? weather.precipitation_probability_pct ?? 0;
  const tomorrowWillRain = tomorrowRainProb >= 40;

  const windSpeed = weather.wind_speed_kmh ?? 0;
  const isSprayingSafe = windSpeed < 15 && (weather.precipitation_probability_pct ?? 0) < 30;

  return (
    <section id="field-intelligence" className="scroll-mt-24 space-y-12 mb-24 px-6 sm:px-12 lg:px-16 max-w-7xl mx-auto">
      {/* Massive Editorial Section Heading */}
      <div className="border-b border-canvas-border pb-8">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-moss-800 font-semibold block mb-2">
          ACTIONABLE FIELD CONDITIONS
        </span>
        <h2 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-black text-soil-950 tracking-tight leading-[0.92]">
          WHAT'S HAPPENING<br />
          <span className="italic font-light text-soil-600">IN YOUR FIELD?</span>
        </h2>
        <p className="text-lg sm:text-xl text-soil-700 font-light mt-4 max-w-xl">
          Real environmental telemetry translated into immediate agronomic awareness.
        </p>
      </div>

      {/* Editorial Composition: Primary Actionable Statement First */}
      <div className="bg-white rounded-3xl border border-canvas-border shadow-elevated overflow-hidden">
        <div className="p-8 sm:p-14 space-y-8">
          {/* Top Label */}
          <div className="flex items-center justify-between text-xs font-mono text-soil-400 uppercase tracking-widest border-b border-canvas-border pb-4">
            <span>IMMEDIATE 24-HOUR OUTLOOK</span>
            <span>OPEN-METEO VERIFIED DATA</span>
          </div>

          {/* Grand Actionable Headline */}
          <div className="space-y-4 max-w-3xl">
            <div className="font-mono text-sm tracking-widest uppercase font-bold text-harvest-600">
              TOMORROW • {tomorrowWillRain ? 'PRECIPITATION EXPECTED' : 'CLEAR & STABLE ATMOSPHERE'}
            </div>

            <h3 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-normal text-soil-950 leading-[1.05]">
              {tomorrowWillRain ? (
                <>
                  Rain is forecast for tomorrow.<br />
                  <span className="italic font-serif text-soil-600">"You may want to delay scheduled irrigation."</span>
                </>
              ) : (
                <>
                  Skies are stable and clear.<br />
                  <span className="italic font-serif text-soil-600">"Favorable conditions for scheduled irrigation & feeding."</span>
                </>
              )}
            </h3>

            <p className="text-base sm:text-lg text-soil-700 font-light leading-relaxed pt-2">
              {tomorrowWillRain
                ? `Precipitation probability reaches ${tomorrowRainProb}%. Delaying water delivery conserves canal or borewell resources and prevents standing water accumulation in ${field.crop_type} root zones.`
                : `Negligible rain hazard (${tomorrowRainProb}%). Daytime temperatures (${Math.round(tomorrow?.temp_max || 32)}°C) favor regular crop water uptake without leaching risk.`}
            </p>
          </div>

          {/* Spraying & Environmental Feasibility Row */}
          <div className="pt-6 border-t border-canvas-border grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-soil-700">
            <div>
              <span className="font-mono text-soil-400 uppercase block mb-1">Agrochemical Spraying</span>
              <strong className="text-soil-950 font-serif text-base block">
                {isSprayingSafe ? 'Window Safe' : 'Spray Caution'}
              </strong>
              <p className="text-soil-600 mt-0.5">
                {isSprayingSafe
                  ? `Wind is calm (${windSpeed} km/h). Low drift hazard.`
                  : `Wind velocity (${windSpeed} km/h) or humidity may reduce deposition.`}
              </p>
            </div>

            <div>
              <span className="font-mono text-soil-400 uppercase block mb-1">Vegetation & Biomass</span>
              <strong className="text-soil-950 font-serif text-base block">
                Sentinel-2 STAC Active
              </strong>
              <p className="text-soil-600 mt-0.5">
                Scene {satellite?.scene_id ? satellite.scene_id.substring(0, 18) : 'Observed'}. NDVI uncalculated locally.
              </p>
            </div>

            <div>
              <span className="font-mono text-soil-400 uppercase block mb-1">Soil Profile</span>
              <strong className="text-soil-950 font-serif text-base block">
                {soil?.ph ? `pH ${soil.ph} • ${soil.texture || 'Loam'}` : 'Regional Model Baseline'}
              </strong>
              <p className="text-soil-600 mt-0.5">
                {soil?.source_name || 'Standard regional agronomic profile.'}
              </p>
            </div>
          </div>

          {/* Expandable Progressively Disclosed Telemetry Details */}
          <div className="pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 text-xs font-mono font-semibold text-moss-800 hover:text-moss-900 cursor-pointer"
            >
              <span>{showDetails ? 'Hide Meteorological & Risk Details' : 'View Full Telemetry Breakdown'}</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetails && (
              <div className="mt-6 pt-6 border-t border-canvas-border space-y-6 animate-fade-in text-xs">
                {/* 5-Day Daily Trajectory */}
                <div>
                  <span className="font-mono text-soil-400 uppercase tracking-wider block mb-3 font-semibold">
                    7-Day Meteorological Trajectory (Open-Meteo)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {weather.daily_forecast?.slice(0, 5).map((d, i) => (
                      <div key={i} className="p-3 bg-canvas-100 rounded-2xl border border-canvas-border space-y-1">
                        <div className="font-mono text-soil-500 font-bold">
                          {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                        </div>
                        <div className="font-serif font-bold text-soil-950 text-sm">{Math.round(d.temp_max)}° / {Math.round(d.temp_min)}°</div>
                        <div className="text-[11px] text-blue-700 font-mono font-bold">{d.precipitation_probability_max}% Rain</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deterministic Risk Breakdown */}
                {risks.length > 0 && (
                  <div>
                    <span className="font-mono text-soil-400 uppercase tracking-wider block mb-3 font-semibold">
                      Deterministic Risk Matrix Evaluated
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {risks.map((r, idx) => (
                        <div key={idx} className="p-3 bg-canvas-100 rounded-2xl border border-canvas-border space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="font-serif font-bold text-soil-900">{r.what_risk}</span>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-soil-800 border border-canvas-border">
                              {r.level}
                            </span>
                          </div>
                          <p className="text-soil-600 text-[11px] leading-snug">{r.why_evidence}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
