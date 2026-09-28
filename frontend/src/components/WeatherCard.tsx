import React from 'react';
import { WeatherData } from '../types';
import { DataSourceBadge } from './DataSourceBadge';
import { CloudRain, Wind, Droplets, Thermometer, Sun, AlertTriangle, Compass } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface WeatherCardProps {
  weather: WeatherData | null;
  loading?: boolean;
  isDemo?: boolean;
  isCached?: boolean;
  cachedAt?: number | string | null;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  loading,
  isDemo = false,
  isCached = false,
  cachedAt
}) => {
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
        <div className="h-28 bg-slate-50 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!weather || weather.status === 'UNAVAILABLE') {
    return (
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Weather data unavailable</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Open-Meteo meteorological feed is temporarily unreachable or returned no numerical forecast for this coordinate. KrishiNet never invents synthetic temperature or rainfall percentages.
        </p>
        <DataSourceBadge
          source="Open-Meteo Public API"
          dataType="Numerical Weather Prediction"
          retrievedAt={weather?.retrieved_at}
          status="UNAVAILABLE"
          isCached={isCached}
          cachedAt={cachedAt}
        />
      </div>
    );
  }

  // Format hourly chart data (12 points)
  const chartData = (weather.hourly_forecast || []).slice(0, 12).map((item) => ({
    time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: item.temperature_c,
    rainProb: item.precipitation_probability
  }));

  const cardStatus = isDemo ? 'LIVE (DEMO COORD)' : weather.status;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Meteorological Intelligence</span>
          </h3>
          <p className="text-xs text-slate-500">Live numerical atmospheric forecast from Open-Meteo</p>
        </div>
        <div className="flex items-center space-x-2">
          {isCached ? (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded font-semibold border bg-amber-50 text-amber-800 border-amber-300">
              CACHED (OFFLINE)
            </span>
          ) : weather.cache_status ? (
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold border ${
                weather.cache_status === 'LIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : weather.cache_status === 'FRESH'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {weather.cache_status === 'LIVE' ? '● LIVE' : `CACHE: ${weather.cache_status}`}
            </span>
          ) : null}
          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 font-sans border border-slate-200">
            {weather.weather_desc || 'Atmospheric Check'}
          </span>
        </div>
      </div>

      {/* Primary Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <Thermometer className="w-3.5 h-3.5 text-rose-500" />
            <span>Temperature</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {weather.temperature_c !== null ? `${weather.temperature_c}°C` : 'Unavailable'}
          </div>
          {weather.apparent_temp_c !== null && weather.apparent_temp_c !== undefined && (
            <div className="text-[11px] text-slate-400 mt-0.5">Feels {weather.apparent_temp_c}°C</div>
          )}
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            <span>Rel. Humidity</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {weather.humidity_pct !== null ? `${weather.humidity_pct}%` : 'Unavailable'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Atmospheric vapor</div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-600" />
            <span>Rain Probability</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {weather.precipitation_probability_pct !== null
              ? `${weather.precipitation_probability_pct}%`
              : 'Unavailable'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {weather.precipitation_mm ? `${weather.precipitation_mm} mm expected` : '0 mm rain'}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <Wind className="w-3.5 h-3.5 text-teal-600" />
            <span>Wind Speed</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {weather.wind_speed_kmh !== null ? `${weather.wind_speed_kmh} km/h` : 'Unavailable'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {weather.wind_speed_kmh && weather.wind_speed_kmh > 15 ? 'Drift caution' : 'Calm / safe'}
          </div>
        </div>
      </div>

      {/* Hourly Trend Chart */}
      {chartData.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">12-Hour Trajectory (Air Temperature & Rain Probability)</span>
            <span className="text-[10px] text-slate-400 font-mono">1h step</span>
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'temp' ? `${val}°C` : `${val}%`,
                    name === 'temp' ? 'Temperature' : 'Rain Probability'
                  ]}
                  labelStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                  contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                />
                <Area type="monotone" dataKey="temp" stroke="#16a34a" fillOpacity={1} fill="url(#tempGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 7-Day Forecast Micro Cards */}
      {weather.daily_forecast && weather.daily_forecast.length > 0 && (
        <div className="pt-1">
          <div className="text-xs font-bold text-slate-700 mb-2">7-Day Agro-Climatic Outlook</div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {weather.daily_forecast.map((day, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-md p-1.5 hover:bg-white transition-colors">
                <div className="font-semibold text-[11px] text-slate-600">
                  {new Date(day.date).toLocaleDateString([], { weekday: 'short' })}
                </div>
                <div className="text-[11px] font-bold text-slate-900 my-0.5">
                  {Math.round(day.temp_max)}°
                </div>
                <div className="text-[10px] text-slate-400">
                  {Math.round(day.temp_min)}°
                </div>
                {day.precipitation_probability_max > 25 && (
                  <div className="text-[9px] font-bold text-blue-600 mt-1">
                    {day.precipitation_probability_max}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Provenance Badge */}
      <DataSourceBadge
        source="Open-Meteo Public API"
        dataType="Numerical Weather Prediction (ECMWF & GFS Models)"
        retrievedAt={weather.retrieved_at}
        status={isCached ? 'CACHED (OFFLINE)' : cardStatus}
        isCached={isCached}
        cachedAt={cachedAt}
      />
    </div>
  );
};
