import React from 'react';
import { Field } from '../types';
import { Plus, Check, MapPin, Edit3, Trash2, ArrowRight } from 'lucide-react';

interface MyFieldsStoryProps {
  fields: Field[];
  selectedFieldIds: number[];
  activeFieldId: number | null;
  onSelectField: (field: Field) => void;
  onToggleFieldSelection: (fieldId: number) => void;
  onSelectAllFields: () => void;
  onClearSelection: () => void;
  onAddFieldClick: () => void;
  onEditFieldClick: (field: Field) => void;
  onDeleteFieldClick: (fieldId: number) => void;
}

import { FieldVisual } from '../design-system/FieldVisual';

export const MyFieldsStory: React.FC<MyFieldsStoryProps> = ({
  fields,
  selectedFieldIds,
  activeFieldId,
  onSelectField,
  onToggleFieldSelection,
  onSelectAllFields,
  onClearSelection,
  onAddFieldClick,
  onEditFieldClick,
  onDeleteFieldClick
}) => {
  const allSelected = fields.length > 0 && selectedFieldIds.length === fields.length;
  const isMultiSelecting = selectedFieldIds.length > 1;

  // Responsive grid depending on actual field count (1 to 4)
  const gridClasses =
    fields.length === 1
      ? 'grid grid-cols-1 md:grid-cols-12 gap-8'
      : fields.length === 2
      ? 'grid grid-cols-1 md:grid-cols-2 gap-8'
      : fields.length === 3
      ? 'grid grid-cols-1 md:grid-cols-3 gap-8'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6';

  return (
    <section
      id="your-land"
      className="scroll-mt-20 space-y-10 mb-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto"
    >
      {/* Editorial Section Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-canvas-border pb-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-moss-800 font-semibold block mb-2">
            PARCELS UNDER CULTIVATION
          </span>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-soil-950 tracking-tight leading-[0.95]">
            MY FIELDS.<br />
            <span className="italic font-light text-soil-600">Your farm, at a glance.</span>
          </h2>
        </div>

        {/* Selection & Farm Limit Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {fields.length > 1 && (
            <div className="flex items-center space-x-2 text-xs font-mono">
              <button
                onClick={allSelected ? onClearSelection : onSelectAllFields}
                className="px-3.5 py-2 rounded-full border border-canvas-border bg-white hover:bg-canvas-100 text-soil-800 font-semibold transition-colors cursor-pointer"
              >
                {allSelected ? 'Clear All' : `Select All (${fields.length})`}
              </button>
              {isMultiSelecting && (
                <span className="text-moss-800 font-bold px-2">
                  Comparing {selectedFieldIds.length} Parcels
                </span>
              )}
            </div>
          )}

          {fields.length < 4 && (
            <button
              onClick={onAddFieldClick}
              className="px-4 py-2 rounded-full bg-moss-800 hover:bg-moss-900 text-white font-sans text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-subtle cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Field ({fields.length}/4)</span>
            </button>
          )}
        </div>
      </div>

      {/* Field Parcels Display (Feels like physical pieces of land) */}
      <div className={gridClasses}>
        {fields.map((field) => {
          const isSelected = selectedFieldIds.includes(field.id);
          const isActive = activeFieldId === field.id;
          return (
            <div
              key={field.id}
              onClick={() => onSelectField(field)}
              className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                fields.length === 1 ? 'md:col-span-8' : ''
              } ${
                isActive
                  ? 'shadow-field ring-2 ring-moss-700 bg-white'
                  : isSelected
                  ? 'shadow-elevated ring-1 ring-moss-600/40 bg-white'
                  : 'shadow-subtle border border-canvas-border bg-white hover:shadow-elevated'
              }`}
            >
              {/* Parcel Cadastral Visual */}
              <div className="relative w-full overflow-hidden">
                <FieldVisual
                  cropType={field.crop_type}
                  boundaryGeoJson={field.boundary_geojson}
                  name={field.name}
                  areaAcres={field.area_acres}
                  variant={fields.length === 1 ? 'hero' : 'card'}
                />

                {/* Top Badge & Multi-select Checkbox */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest uppercase font-semibold text-white/95 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                    PARCEL 0{field.id}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFieldSelection(field.id);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-moss-600 text-white shadow-sm'
                        : 'bg-black/50 text-white/60 hover:bg-black/80'
                    }`}
                    title={isSelected ? 'Deselect parcel' : 'Select parcel'}
                  >
                    <Check className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                </div>

                {/* Bottom Details Layered on Visual */}
                <div className="absolute bottom-5 left-5 right-5 text-white space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-harvest-300">
                    <span className="font-bold">{field.crop_type}</span>
                    {field.variety && <span className="text-white/80">({field.variety})</span>}
                    <span>•</span>
                    <span>{field.area_acres ? `${field.area_acres.toFixed(2)} Acres` : 'Area not set'}</span>
                    {field.irrigation_method && (
                      <>
                        <span>•</span>
                        <span className="text-harvest-200">{field.irrigation_method}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white leading-tight">
                    {field.name}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-white/80 pt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-harvest-400 shrink-0" />
                      <span>{field.district ? `${field.district}, ` : ''}{field.state}</span>
                    </span>

                    <span className={`font-mono text-[11px] ${
                      field.soil_report_status === 'UPLOADED' ? 'text-emerald-300' : 'text-amber-300/90'
                    }`}>
                      {field.soil_report_status === 'UPLOADED' ? '● Soil Report Active' : '● Soil Baseline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footnote */}
              <div className="p-4 flex items-center justify-between border-t border-canvas-border text-xs">
                <span className="font-serif font-semibold text-soil-900 group-hover:text-moss-800 transition-colors flex items-center space-x-1">
                  <span>{isActive ? '● Currently Focused' : 'Focus this field'}</span>
                  {!isActive && <ArrowRight className="w-3.5 h-3.5 text-soil-400 group-hover:translate-x-0.5 transition-transform" />}
                </span>

                <div className="flex items-center space-x-1 text-soil-400">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditFieldClick(field);
                    }}
                    className="p-1.5 hover:text-soil-900 hover:bg-canvas-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit farm details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {!field.is_demo && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFieldClick(field.id);
                      }}
                      className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove farm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* If farmer has only 1 field: clean invitation to add another */}
        {fields.length === 1 && (
          <div
            onClick={onAddFieldClick}
            className="md:col-span-4 border-2 border-dashed border-canvas-border hover:border-moss-600 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer hover:bg-moss-50/20 transition-all min-h-[300px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-canvas-200 text-soil-600 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-soil-900 text-lg">Add Another Parcel</h4>
              <p className="text-xs text-soil-500 font-light mt-1 max-w-xs">
                Cultivate more than one field? Add up to 4 parcels to monitor weather, soil and crop health in one place.
              </p>
            </div>
            <span className="text-xs font-semibold text-moss-800 uppercase tracking-wider font-mono">
              + Add Field (1/4)
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
