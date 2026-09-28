import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Field } from '../types';
import { FieldSatellitePreview } from '../components/FieldSatellitePreview';
import { Button } from '../design-system/Button';
import { EmptyState } from '../design-system/EmptyState';
import { ErrorState } from '../design-system/ErrorState';
import { LoadingSkeleton } from '../design-system/LoadingSkeleton';
import { Plus, MapPin, ArrowRight, Layers, Calendar, FlaskConical } from 'lucide-react';

export const FieldsScreen: React.FC = () => {
  const { navigate } = useRouter();
  const { t } = useLanguage();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFields = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFields(false); // Only real farmer parcels
      setFields(data);
    } catch (err: any) {
      console.error('Failed to load fields:', err);
      setError('Could not load farm parcels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#1B4D3E] font-semibold block mb-1">
            {t('parcelRegistry', 'PARCEL REGISTRY')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#1C1510] tracking-tight">
            {t('myFields', 'My Fields')}
          </h1>
          <p className="text-sm text-[#6B5E51] font-light mt-1">
            {t('fieldsSubtitle', 'Your farm, field by field.')}
          </p>
        </div>

        {fields.length < 4 ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('add-field')}
            icon={<Plus className="w-4 h-4" />}
            className="cursor-pointer"
          >
            {t('addField', '+ Add Field')} ({fields.length}/4)
          </Button>
        ) : (
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#1B4D3E] bg-[#E8F0EA] px-3.5 py-2.5 rounded-xl border border-[#1B4D3E]/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#1B4D3E]" />
            <span>({fields.length}/4 {t('fieldsSubtitle', 'Fields')})</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <LoadingSkeleton className="h-72 w-full" />
          <LoadingSkeleton className="h-72 w-full" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState message={error} onRetry={loadFields} />
      )}

      {/* Empty State */}
      {!loading && !error && fields.length === 0 && (
        <EmptyState
          icon={<Layers className="w-7 h-7" />}
          title={t('noFieldsTitle', 'No fields yet')}
          description={t('noFieldsDescription', 'Add your first field to start building your digital farm.')}
          actionLabel={t('addField', 'Add Field')}
          onAction={() => navigate('add-field')}
        />
      )}

      {/* Fields Grid (Field Boundary Itself as the Visual Element) */}
      {!loading && !error && fields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {fields.map((field) => (
            <div
              key={field.id}
              onClick={() => navigate('field-detail', { fieldId: field.id })}
              className="group bg-white rounded-[2rem] border border-[#E8E2D8] hover:border-[#1B4D3E]/30 p-5 space-y-4 shadow-subtle hover:shadow-elevated transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              {/* Real Satellite Map Preview */}
              <FieldSatellitePreview
                cropType={field.crop_type}
                name={field.name}
                boundaryGeoJson={field.boundary_geojson}
                latitude={field.latitude}
                longitude={field.longitude}
                height="190px"
              />

              {/* Card Bottom Details */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-xl text-[#1C1510] group-hover:text-[#1B4D3E] transition-colors">
                      {field.name}
                    </h3>
                    <span className="font-mono text-[10px] text-[#786C60] uppercase">
                      {t('parcelNumber', 'PARCEL #')}{field.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C4535] mt-1">
                    <span className="font-semibold text-[#1B4D3E]">{field.crop_type}</span>
                    {field.variety && <span className="text-[#786C60]">({field.variety})</span>}
                    <span>•</span>
                    <span>{field.area_acres ? `${field.area_acres.toFixed(1)} ${t('acres', 'acres')}` : t('areaNotSet', 'Area not specified')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#786C60]">
                  <span className="flex items-center space-x-1 truncate max-w-[65%]">
                    <MapPin className="w-3.5 h-3.5 text-[#C78520] shrink-0" />
                    <span className="truncate">{field.district ? `${field.district}, ` : ''}{field.state}</span>
                  </span>

                  <span className="font-sans font-semibold text-[#1B4D3E] flex items-center space-x-1 shrink-0 group-hover:translate-x-1 transition-transform">
                    <span>{t('viewField', 'View Field')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
