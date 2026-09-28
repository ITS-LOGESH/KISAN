import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Field, WeatherData, SatelliteData, SoilData, RiskResult, Advisory } from '../types';
import { FieldExperience } from '../components/FieldExperience';
import { SoilUploadModal } from '../components/SoilUploadModal';
import { AskFieldModal } from '../components/AskFieldModal';
import { LoadingSkeleton } from '../design-system/LoadingSkeleton';
import { ErrorState } from '../design-system/ErrorState';
import { ArrowLeft } from 'lucide-react';

export const FieldDetailScreen: React.FC = () => {
  const { params, navigate, goBack } = useRouter();
  const { t } = useLanguage();
  const fieldId = params.fieldId;

  const [field, setField] = useState<Field | null>(null);
  const [allFields, setAllFields] = useState<Field[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [satellite, setSatellite] = useState<SatelliteData | null>(null);
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [risks, setRisks] = useState<RiskResult[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);

  const loadFieldData = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await api.getFields(true);
      setAllFields(all);

      const targetField = fieldId ? all.find((f) => f.id === fieldId) || all[0] : all[0];
      if (!targetField) {
        setError('Field parcel not found.');
        setLoading(false);
        return;
      }

      setField(targetField);

      // Fetch telemetry
      const [w, s, sl, r, a] = await Promise.all([
        api.getFieldWeather(targetField.id).catch(() => null),
        api.getFieldSatellite(targetField.id).catch(() => null),
        api.getFieldSoil(targetField.id).catch(() => null),
        api.getFieldRisks(targetField.id).catch(() => []),
        api.getFieldAdvisories(targetField.id).catch(() => []),
      ]);

      setWeather(w);
      setSatellite(s);
      setSoil(sl);
      setRisks(r);
      setAdvisories(a);
    } catch (err: any) {
      console.error('Failed to load field details:', err);
      setError('Could not load field telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFieldData();
  }, [fieldId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <LoadingSkeleton className="h-8 w-32" />
        <LoadingSkeleton className="h-20 w-full" />
        <LoadingSkeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="space-y-4 max-w-md mx-auto py-8">
        <ErrorState message={error || 'Field not found'} onRetry={loadFieldData} />
        <div className="text-center">
          <button
            onClick={() => navigate('fields')}
            className="text-xs font-semibold text-[#1B4D3E] hover:underline"
          >
            {t('backToAllFields', '← Back to All Fields')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Back Action */}
      <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
        <button
          onClick={() => navigate('fields')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#5C4535] hover:text-[#1C1510] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToAllFields', 'Back to All Fields')}</span>
        </button>

        <span className="font-mono text-xs text-[#786C60]">
          Viewing: <strong className="text-[#1C1510] font-semibold">{field.name}</strong>
        </span>
      </div>

      {/* Field Experience Core Narrative */}
      <FieldExperience
        field={field}
        allFields={allFields}
        weather={weather}
        satellite={satellite}
        soil={soil}
        risks={risks}
        advisories={advisories}
        loadingTelemetry={false}
        onRefreshTelemetry={loadFieldData}
        onSelectField={(f) => navigate('field-detail', { fieldId: f.id })}
        onAskMyFieldClick={() => setShowAskModal(true)}
        onCheckCropClick={() => navigate('check-crop')}
        onUploadSoilClick={() => setShowSoilModal(true)}
        isCached={field ? api.getCacheMeta(`weather_${field.id}`).isCached : false}
        cachedAt={field ? api.getCacheMeta(`weather_${field.id}`).cachedAt : null}
      />

      {/* Modals */}
      <SoilUploadModal
        fieldId={field.id}
        fieldName={field.name}
        isOpen={showSoilModal}
        onClose={() => setShowSoilModal(false)}
        onSoilSaved={loadFieldData}
      />

      <AskFieldModal
        field={field}
        isOpen={showAskModal}
        onClose={() => setShowAskModal(false)}
      />
    </div>
  );
};
