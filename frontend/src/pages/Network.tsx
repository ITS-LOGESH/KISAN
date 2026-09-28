import React, { useState, useEffect } from 'react';
import { NetworkOverview } from '../types';
import { api } from '../services/api';
import {
  Share2, Database, Server, Info, ArrowDown, CloudSun, Satellite, ShieldAlert, BookOpen, CheckSquare
} from 'lucide-react';

export const Network: React.FC = () => {
  const [overview, setOverview] = useState<NetworkOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetwork = async () => {
      setLoading(true);
      try {
        const data = await api.getNetworkOverview();
        setOverview(data);
      } catch (err) {
        console.error('Failed to load network overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNetwork();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in mb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-canvas-border shadow-subtle p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-canvas-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-moss-100 text-moss-900 border border-moss-200 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                PUBLIC FEDERATION ARCHITECTURE
              </span>
              <span className="text-xs text-soil-500 font-mono">Cross-State Agricultural Interoperability</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-soil-950 tracking-tight">
              India Agricultural Intelligence Network
            </h1>
            <p className="text-xs sm:text-sm text-soil-600 max-w-3xl leading-relaxed">
              Demonstrating cross-state agricultural intelligence cooperation through open public datasets, shared risk algorithms, and decentralized data standards across Indian states.
            </p>
          </div>

          <div className="bg-canvas-100 border border-canvas-border rounded-2xl p-4 text-right shrink-0">
            <div className="text-[10px] text-soil-400 font-mono uppercase">Network Node Status</div>
            <div className="text-sm font-bold text-emerald-800 flex items-center justify-end space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Federation Active</span>
            </div>
          </div>
        </div>

        {/* Mandatory Transparency Notice */}
        <div className="bg-canvas-100 border border-canvas-border rounded-2xl p-4 text-xs text-soil-700 flex items-start space-x-3">
          <Info className="w-4 h-4 text-soil-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong>Public Data Architecture Note:</strong> This demonstration illustrates how state agricultural departments, ICAR institutes, and state universities can exchange open data schemas without proprietary lock-in. Government systems are not claimed to be live production endpoints.
          </span>
        </div>
      </div>

      {/* Network Overview Key Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-canvas-border shadow-subtle space-y-1">
          <div className="flex items-center space-x-1.5 text-xs text-soil-500 mb-1">
            <Server className="w-3.5 h-3.5 text-moss-700" />
            <span>Participating States</span>
          </div>
          <div className="text-3xl font-serif font-bold text-soil-950">
            {overview ? overview.total_states : 6}
          </div>
          <div className="text-[11px] text-soil-400">Federated state profiles</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-canvas-border shadow-subtle space-y-1">
          <div className="flex items-center space-x-1.5 text-xs text-soil-500 mb-1">
            <ActivityIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Live Nodes</span>
          </div>
          <div className="text-3xl font-serif font-bold text-soil-950">
            {overview ? overview.active_monitoring_nodes : 4}
          </div>
          <div className="text-[11px] text-soil-400">Tamil Nadu, Punjab, MH, KA</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-canvas-border shadow-subtle space-y-1">
          <div className="flex items-center space-x-1.5 text-xs text-soil-500 mb-1">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Public Datasets Linked</span>
          </div>
          <div className="text-3xl font-serif font-bold text-soil-950">
            {overview ? overview.public_datasets_linked : 12}
          </div>
          <div className="text-[11px] text-soil-400">Open STAC, Open-Meteo, ICAR</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-canvas-border shadow-subtle space-y-1">
          <div className="flex items-center space-x-1.5 text-xs text-soil-500 mb-1">
            <Share2 className="w-3.5 h-3.5 text-harvest-600" />
            <span>Shared Risk Models</span>
          </div>
          <div className="text-3xl font-serif font-bold text-soil-950">
            {overview ? overview.shared_risk_models : 5}
          </div>
          <div className="text-[11px] text-soil-400">Heat, flood, drought algorithms</div>
        </div>
      </div>

      {/* Conceptual Pipeline Visualization */}
      <div className="bg-white rounded-3xl border border-canvas-border shadow-subtle p-6 sm:p-8 space-y-4">
        <h3 className="font-serif font-bold text-soil-950 text-base flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-moss-700" />
          <span>Inter-State Cooperation Architecture Pipeline</span>
        </h3>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs pt-2">
          <div className="flex-1 w-full bg-canvas-100 p-4 rounded-2xl border border-canvas-border space-y-1 text-center">
            <div className="font-serif font-bold text-soil-950 text-xs uppercase tracking-wider">1. PUBLIC DATA</div>
            <p className="text-soil-600 text-[11px]">
              Open-Meteo NWP forecasts, Copernicus Sentinel-2 STAC registries, and ICAR soil maps published openly.
            </p>
          </div>

          <ArrowDown className="w-4 h-4 text-soil-400 shrink-0 md:-rotate-90" />

          <div className="flex-1 w-full bg-canvas-100 p-4 rounded-2xl border border-canvas-border space-y-1 text-center">
            <div className="font-serif font-bold text-soil-950 text-xs uppercase tracking-wider">2. STATE AGRI SYSTEMS</div>
            <p className="text-soil-600 text-[11px]">
              TNAU (TN), PAU (Punjab), MPKV (MH), and UAS (KA) ingest telemetry into regional agro-climatic zones.
            </p>
          </div>

          <ArrowDown className="w-4 h-4 text-soil-400 shrink-0 md:-rotate-90" />

          <div className="flex-1 w-full bg-canvas-100 p-4 rounded-2xl border border-canvas-border space-y-1 text-center">
            <div className="font-serif font-bold text-soil-950 text-xs uppercase tracking-wider">3. SHARED INTELLIGENCE</div>
            <p className="text-soil-600 text-[11px]">
              Cross-state exchange of heat tolerance models, drought heuristics, and stubble fire satellite alerts.
            </p>
          </div>

          <ArrowDown className="w-4 h-4 text-soil-400 shrink-0 md:-rotate-90" />

          <div className="flex-1 w-full bg-moss-50 p-4 rounded-2xl border border-moss-300 space-y-1 text-center">
            <div className="font-serif font-bold text-moss-950 text-xs uppercase tracking-wider">4. LOCAL FIELD DECISIONS</div>
            <p className="text-moss-800 text-[11px]">
              Actionable irrigation postponement and disease advisories delivered directly to smallholders.
            </p>
          </div>
        </div>
      </div>

      {/* State Node Grid */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-soil-950 text-xl">
          Federated State Profiles & Active Nodes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {overview?.states.map((st) => (
            <div
              key={st.state_name}
              className="bg-white border border-canvas-border rounded-3xl p-6 shadow-subtle space-y-4 hover:shadow-elevated transition-all"
            >
              <div className="flex items-start justify-between gap-2 border-b border-canvas-border pb-3">
                <div>
                  <h4 className="font-serif font-bold text-soil-950 text-lg">{st.state_name}</h4>
                  <span className="text-xs text-soil-500">Capital: {st.capital}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                    st.node_status === 'ACTIVE_NODE'
                      ? 'bg-moss-100 text-moss-800 border-moss-200'
                      : 'bg-canvas-200 text-soil-600 border-canvas-border'
                  }`}
                >
                  {st.node_status.replace('_', ' ')}
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div>
                  <span className="text-soil-400 block font-medium">Agro-Climatic Zone:</span>
                  <span className="font-semibold text-soil-800">{st.agro_climatic_zone}</span>
                </div>

                <div>
                  <span className="text-soil-400 block font-medium">Key Monitored Crops:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {st.primary_crops.map((c, cIdx) => (
                      <span key={cIdx} className="bg-canvas-100 text-soil-700 px-2 py-0.5 rounded text-[11px]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-soil-400 block font-medium">Shared Public Datasets:</span>
                  <ul className="list-disc pl-4 text-[11px] text-soil-600 space-y-0.5 mt-0.5">
                    {st.shared_datasets.map((d, dIdx) => (
                      <li key={dIdx}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-canvas-border text-[11px] text-soil-500 flex items-center justify-between font-mono">
                <span>{st.active_fields_count} Active Fields</span>
                <span className="text-moss-700 font-semibold font-sans">Synced</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
