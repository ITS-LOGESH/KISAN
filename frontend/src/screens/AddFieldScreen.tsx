import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Field } from '../types';
import { FarmerOnboarding } from '../components/FarmerOnboarding';
import { ArrowLeft } from 'lucide-react';

export const AddFieldScreen: React.FC = () => {
  const { navigate } = useRouter();
  const { language, tamilDialect, t } = useLanguage();
  const [fieldsCount, setFieldsCount] = useState<number>(0);

  useEffect(() => {
    api.getFields(true).then((fieldsList) => {
      setFieldsCount(fieldsList.filter((f) => !f.is_demo).length);
    }).catch(() => {});
  }, []);

  const handleFieldCreated = (newField: Field) => {
    navigate('field-detail', { fieldId: newField.id });
  };

  const handleClose = () => {
    navigate('fields');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
        <button
          onClick={handleClose}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#5C4535] hover:text-[#1C1510] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back', 'Cancel & Back')}</span>
        </button>

        <span className="font-mono text-xs text-[#786C60]">
          {t('addField', 'New Parcel Wizard')}
        </span>
      </div>

      <FarmerOnboarding
        isOpen={true}
        inline={true}
        onClose={handleClose}
        onFieldCreated={handleFieldCreated}
        existingFieldsCount={fieldsCount}
        initialLanguage={language}
        initialTamilDialect={tamilDialect}
      />
    </div>
  );
};
