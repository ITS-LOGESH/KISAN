import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Field } from '../types';
import { DiseaseStory } from '../components/DiseaseStory';
import { LoadingSkeleton } from '../design-system/LoadingSkeleton';
import { ArrowLeft } from 'lucide-react';

export const CheckCropScreen: React.FC = () => {
  const { navigate } = useRouter();
  const { language, tamilDialect, t } = useLanguage();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFields(true).then((fieldsList) => {
      setFields(fieldsList);
      if (fieldsList.length > 0) {
        setSelectedField(fieldsList[0]);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <LoadingSkeleton className="h-8 w-40" />
        <LoadingSkeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
        <button
          onClick={() => navigate('home')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#5C4535] hover:text-[#1C1510] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToHome', 'Back to Home')}</span>
        </button>

        {fields.length > 1 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#786C60] font-mono text-[11px]">{t('fields', 'Field')}:</span>
            <select
              value={selectedField?.id || ''}
              onChange={(e) => {
                const f = fields.find((item) => item.id === parseInt(e.target.value, 10));
                if (f) setSelectedField(f);
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#E8E2D8] text-xs font-semibold text-[#1C1510] outline-none cursor-pointer"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.crop_type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Disease Pathology Screening Component */}
      <DiseaseStory
        field={selectedField}
        language={language}
        tamilDialect={tamilDialect}
      />
    </div>
  );
};
