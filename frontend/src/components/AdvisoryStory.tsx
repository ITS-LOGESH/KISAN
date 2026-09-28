import React from 'react';
import { Field, RiskResult, Advisory } from '../types';
import { ArrowRight, Droplets, Wind, AlertTriangle, CheckCircle2, FlaskConical, Sprout } from 'lucide-react';

interface AdvisoryStoryProps {
  activeField: Field | null;
  selectedFields: Field[];
  risks: RiskResult[];
  advisories: Advisory[];
  onSelectField: (field: Field) => void;
  onUploadSoilClick?: () => void;
}

export const AdvisoryStory: React.FC<AdvisoryStoryProps> = ({
  activeField,
  selectedFields,
  risks,
  advisories,
  onSelectField,
  onUploadSoilClick
}) => {
  const isMultiField = selectedFields.length > 1;

  if (!isMultiField) {
    // If only one field is selected, we don't duplicate the single field experience.
    return null;
  }

  return (
    <section id="whole-farm" className="scroll-mt-20 space-y-10 mb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
      {/* Section Heading */}
      <div className="border-b border-canvas-border pb-8">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-moss-800 font-semibold block mb-2">
          WHOLE-FARM COMPARATIVE OVERVIEW
        </span>
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-soil-950 tracking-tight leading-[0.95]">
          YOUR FARM.<br />
          <span className="italic font-light text-soil-600">Comparing {selectedFields.length} parcels.</span>
        </h2>
        <p className="text-base sm:text-lg text-soil-700 font-light mt-3 max-w-xl">
          Highlighting only meaningful operational differences across your active fields.
        </p>
      </div>

      {/* Meaningful Differences Comparative Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {selectedFields.map((field) => {
          const isPaddy = field.crop_type.toLowerCase().includes('rice') || field.crop_type.toLowerCase().includes('paddy');
          const isWheat = field.crop_type.toLowerCase().includes('wheat');
          const isCotton = field.crop_type.toLowerCase().includes('cotton');
          const hasSoilReport = field.soil_report_status === 'UPLOADED';
          const isCurrentActive = activeField?.id === field.id;

          return (
            <div
              key={field.id}
              className={`bg-white rounded-3xl p-8 border shadow-elevated flex flex-col justify-between space-y-6 transition-all ${
                isCurrentActive
                  ? 'ring-2 ring-moss-700 border-moss-300'
                  : 'border-canvas-border hover:shadow-field'
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-soil-400 font-semibold">
                    PARCEL 0{field.id}
                  </span>
                  <span className="text-xs font-mono font-bold text-moss-800 bg-moss-50 px-2.5 py-0.5 rounded-full border border-moss-200">
                    {field.crop_type}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-2xl text-soil-950">
                    {field.name}
                  </h3>
                  <p className="text-xs text-soil-500 font-mono mt-0.5">
                    {field.area_acres ? `${field.area_acres.toFixed(2)} Acres` : 'Area not specified'} • {field.district ? `${field.district}, ` : ''}{field.state}
                  </p>
                </div>

                {/* Meaningful Difference 1: Agronomic Water / Weather Status */}
                <div className="p-4 rounded-2xl bg-canvas-100 border border-canvas-border space-y-1.5">
                  <span className="font-mono text-[10px] uppercase font-bold text-soil-500 block">
                    Water & Microclimate
                  </span>
                  {isPaddy ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-blue-700 font-serif font-bold text-sm">
                        <Droplets className="w-3.5 h-3.5 shrink-0" />
                        <span>Inundation Favorable</span>
                      </div>
                      <p className="text-xs text-soil-600 font-light">
                        Soil moisture optimal for standing shallow water. Low evaporation losses.
                      </p>
                    </div>
                  ) : isWheat ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-amber-700 font-serif font-bold text-sm">
                        <Wind className="w-3.5 h-3.5 shrink-0" />
                        <span>Canopy Cooling Needed</span>
                      </div>
                      <p className="text-xs text-soil-600 font-light">
                        Elevated afternoon temperatures. Light split irrigation preserves grain filling.
                      </p>
                    </div>
                  ) : isCotton ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-purple-700 font-serif font-bold text-sm">
                        <Sprout className="w-3.5 h-3.5 shrink-0" />
                        <span>Aerated Root Zone</span>
                      </div>
                      <p className="text-xs text-soil-600 font-light">
                        Ensure well-drained furrows; avoid prolonged saturation to prevent boll drop.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-emerald-700 font-serif font-bold text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Stable Growth</span>
                      </div>
                      <p className="text-xs text-soil-600 font-light">
                        Standard moisture retention. Favorable weather for routine intercultural operations.
                      </p>
                    </div>
                  )}
                </div>

                {/* Meaningful Difference 2: Soil Data Status */}
                <div className="p-4 rounded-2xl bg-canvas-100 border border-canvas-border space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-soil-500 block">
                    Soil Record Status
                  </span>
                  {hasSoilReport ? (
                    <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-semibold">
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Customized Lab Soil Test Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-amber-700 text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Using Regional Baseline (Soil report missing)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => {
                  onSelectField(field);
                  const el = document.querySelector('#enter-field');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full py-3 px-5 rounded-full text-xs font-sans font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  isCurrentActive
                    ? 'bg-moss-800 text-white shadow-subtle'
                    : 'bg-soil-900 hover:bg-moss-800 text-white'
                }`}
              >
                <span>{isCurrentActive ? '● Focused in Field View' : 'Focus This Parcel'}</span>
                {!isCurrentActive && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
