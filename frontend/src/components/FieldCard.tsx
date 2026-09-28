import React from 'react';
import { Field } from '../types';
import { DemoBadge } from './DemoBadge';
import { MapPin, Sprout, ArrowRight } from 'lucide-react';

interface FieldCardProps {
  field: Field;
  isSelected?: boolean;
  onSelect: (field: Field) => void;
}

export const FieldCard: React.FC<FieldCardProps> = ({ field, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(field)}
      className={`cursor-pointer rounded-xl p-4 border transition-all ${
        isSelected
          ? 'bg-agri-50/70 border-agri-500 shadow-sm ring-1 ring-agri-400'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {field.state} {field.district ? `• ${field.district}` : ''}
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-0.5">{field.name}</h4>
        </div>
        {field.is_demo && <DemoBadge size="sm" />}
      </div>

      <div className="flex items-center space-x-3 text-xs text-slate-600 mb-3">
        <div className="flex items-center space-x-1">
          <Sprout className="w-3.5 h-3.5 text-agri-600" />
          <span className="font-medium text-slate-800">{field.crop_type}</span>
        </div>
        {field.area_acres && (
          <div>
            <span className="text-slate-400">Area:</span> <span className="font-medium">{field.area_acres} ac</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 font-mono">
        <div className="flex items-center space-x-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span>{field.latitude.toFixed(3)}, {field.longitude.toFixed(3)}</span>
        </div>
        <div className="flex items-center space-x-1 text-agri-700 font-semibold font-sans">
          <span>Digital Twin</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
