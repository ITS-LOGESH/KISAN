import React, { useState, useEffect } from 'react';
import { Field, WeatherData, SatelliteData, SoilData, RiskResult, Advisory } from '../types';
import { api } from '../services/api';
import { HeroStory } from '../components/HeroStory';
import { MyFieldsStory } from '../components/MyFieldsStory';
import { FieldExperience } from '../components/FieldExperience';
import { DiseaseStory } from '../components/DiseaseStory';
import { AskFieldStory } from '../components/AskFieldStory';
import { AdvisoryStory } from '../components/AdvisoryStory';
import { AskFieldModal } from '../components/AskFieldModal';
import { FieldModal } from '../components/FieldModal';
import { FarmerOnboarding } from '../components/FarmerOnboarding';
import { SoilUploadModal } from '../components/SoilUploadModal';
import { SupportedLanguage, TamilDialect } from '../utils/i18n';

interface DashboardProps {
  demoMode: boolean;
  onNavigateToField: (field: Field) => void;
  openAddFieldTrigger?: boolean;
  onResetAddFieldTrigger?: () => void;
  language?: SupportedLanguage;
  tamilDialect?: TamilDialect;
}

export const Dashboard: React.FC<DashboardProps> = ({
  demoMode,
  openAddFieldTrigger,
  onResetAddFieldTrigger,
  language = 'en',
  tamilDialect = 'standard'
}) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [activeField, setActiveField] = useState<Field | null>(null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<number[]>([]);

  // Telemetry states
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [satellite, setSatellite] = useState<SatelliteData | null>(null);
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [risks, setRisks] = useState<RiskResult[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);

  const [loadingFields, setLoadingFields] = useState<boolean>(true);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(false);

  // Modals
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showFieldModal, setShowFieldModal] = useState<boolean>(false);
  const [showSoilModal, setShowSoilModal] = useState<boolean>(false);
  const [fieldToEdit, setFieldToEdit] = useState<Field | null>(null);
  const [showAskModal, setShowAskModal] = useState<boolean>(false);

  // Sync external add trigger from navbar
  useEffect(() => {
    if (openAddFieldTrigger) {
      setShowOnboarding(true);
      if (onResetAddFieldTrigger) onResetAddFieldTrigger();
    }
  }, [openAddFieldTrigger, onResetAddFieldTrigger]);

  // Load fields
  const loadFields = async () => {
    setLoadingFields(true);
    try {
      const fetched = await api.getFields(demoMode);
      setFields(fetched);

      if (fetched.length > 0) {
        const currentActive = fetched.find((f) => activeField && f.id === activeField.id) || fetched[0];
        setActiveField(currentActive);
        if (selectedFieldIds.length === 0) {
          setSelectedFieldIds([currentActive.id]);
        }
      } else {
        setActiveField(null);
        setSelectedFieldIds([]);
      }
    } catch (err) {
      console.error('Failed to load fields:', err);
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, [demoMode]);

  // Load telemetry when activeField changes
  const fetchTelemetry = async (fieldId: number) => {
    setLoadingTelemetry(true);
    try {
      const [w, s, sl, r, a] = await Promise.all([
        api.getFieldWeather(fieldId).catch(() => null),
        api.getFieldSatellite(fieldId).catch(() => null),
        api.getFieldSoil(fieldId).catch(() => null),
        api.getFieldRisks(fieldId).catch(() => []),
        api.getFieldAdvisories(fieldId).catch(() => [])
      ]);
      setWeather(w);
      setSatellite(s);
      setSoil(sl);
      setRisks(r);
      setAdvisories(a);
    } catch (err) {
      console.error('Failed to load field telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    if (activeField) {
      fetchTelemetry(activeField.id);
    }
  }, [activeField?.id]);

  // Field Selection Handlers
  const handleSelectField = (field: Field) => {
    setActiveField(field);
    if (!selectedFieldIds.includes(field.id)) {
      setSelectedFieldIds([field.id]);
    }
    // Smooth scroll down to enter-field section
    const el = document.querySelector('#enter-field');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleFieldSelection = (fieldId: number) => {
    if (selectedFieldIds.includes(fieldId)) {
      const remaining = selectedFieldIds.filter((id) => id !== fieldId);
      setSelectedFieldIds(remaining);
      if (activeField?.id === fieldId && remaining.length > 0) {
        const nextActive = fields.find((f) => f.id === remaining[0]) || null;
        setActiveField(nextActive);
      }
    } else {
      setSelectedFieldIds([...selectedFieldIds, fieldId]);
      const newlySelected = fields.find((f) => f.id === fieldId);
      if (newlySelected) setActiveField(newlySelected);
    }
  };

  const handleSelectAllFields = () => {
    setSelectedFieldIds(fields.map((f) => f.id));
  };

  const handleClearSelection = () => {
    if (fields.length > 0) {
      setSelectedFieldIds([fields[0].id]);
      setActiveField(fields[0]);
    } else {
      setSelectedFieldIds([]);
      setActiveField(null);
    }
  };

  const handleAddField = () => {
    setShowOnboarding(true);
  };

  const handleEditField = (field: Field) => {
    setFieldToEdit(field);
    setShowFieldModal(true);
  };

  const handleDeleteField = async (fieldId: number) => {
    if (window.confirm('Are you sure you want to remove this farm parcel?')) {
      try {
        await api.deleteField(fieldId);
        await loadFields();
      } catch (err: any) {
        alert(err.message || 'Failed to delete farm parcel.');
      }
    }
  };

  const handleFieldSaved = (savedField: Field) => {
    loadFields().then(() => {
      setActiveField(savedField);
      setSelectedFieldIds([savedField.id]);
    });
  };

  const handleOnboardingFieldCreated = (newField: Field) => {
    loadFields().then(() => {
      setActiveField(newField);
      setSelectedFieldIds([newField.id]);
      setTimeout(() => {
        const el = document.querySelector('#your-land');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    });
  };

  const selectedFields = fields.filter((f) => selectedFieldIds.includes(f.id));

  return (
    <div id="top" className="space-y-4">
      {/* SECTION 01 — HERO (Full Viewport, Authentic Indian Landscape, Dual Actions) */}
      <HeroStory
        selectedField={activeField}
        onExploreClick={() => {
          const el = document.querySelector('#your-land');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onAddFieldClick={handleAddField}
      />

      {/* SECTION 02 — MY FIELDS ("Your farm, at a glance", 1 to 4 Real Parcels) */}
      <MyFieldsStory
        fields={fields}
        selectedFieldIds={selectedFieldIds}
        activeFieldId={activeField?.id || null}
        onSelectField={handleSelectField}
        onToggleFieldSelection={handleToggleFieldSelection}
        onSelectAllFields={handleSelectAllFields}
        onClearSelection={handleClearSelection}
        onAddFieldClick={handleAddField}
        onEditFieldClick={handleEditField}
        onDeleteFieldClick={handleDeleteField}
      />

      {/* SECTION 03 — FIELD EXPERIENCE (The Field as the Main Character: Header -> Map -> What's Happening -> Weather -> Soil -> Satellite -> Risks -> Advisory) */}
      <FieldExperience
        field={activeField}
        allFields={fields}
        weather={weather}
        satellite={satellite}
        soil={soil}
        risks={risks}
        advisories={advisories}
        loadingTelemetry={loadingTelemetry}
        onRefreshTelemetry={() => activeField && fetchTelemetry(activeField.id)}
        onSelectField={handleSelectField}
        onAskMyFieldClick={() => setShowAskModal(true)}
        onCheckCropClick={() => {
          const el = document.querySelector('#check-crop');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onUploadSoilClick={() => setShowSoilModal(true)}
      />

      {/* SECTION 04 — CHECK YOUR CROP (Contextual Foliar Screening with Registered Crop Context & History) */}
      <DiseaseStory
        field={activeField}
        language={language}
        tamilDialect={tamilDialect}
      />

      {/* SECTION 05 — ASK YOUR FIELD (Contextual Farm Decision Inquiry) */}
      <AskFieldStory
        field={activeField}
        onOpenAskModal={() => setShowAskModal(true)}
      />

      {/* SECTION 06 — WHOLE FARM COMPARATIVE OVERVIEW (Rendered When Multiple Fields Are Selected) */}
      <AdvisoryStory
        activeField={activeField}
        selectedFields={selectedFields}
        risks={risks}
        advisories={advisories}
        onSelectField={handleSelectField}
        onUploadSoilClick={() => setShowSoilModal(true)}
      />

      {/* Contextual Ask My Field Modal */}
      <AskFieldModal
        field={activeField}
        isOpen={showAskModal}
        onClose={() => setShowAskModal(false)}
      />

      {/* Cadastral Farm Registration & Edit Modal */}
      <FieldModal
        isOpen={showFieldModal}
        fieldToEdit={fieldToEdit}
        onClose={() => setShowFieldModal(false)}
        onFieldSaved={handleFieldSaved}
      />

      {/* Farmer Onboarding & Cadastral Field Creation Wizard */}
      <FarmerOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onFieldCreated={handleOnboardingFieldCreated}
        existingFieldsCount={fields.filter((f) => !f.is_demo).length}
        initialLanguage={language}
        initialTamilDialect={tamilDialect}
      />

      {/* Soil Parameter Upload / Record Modal */}
      {activeField && (
        <SoilUploadModal
          fieldId={activeField.id}
          fieldName={activeField.name}
          isOpen={showSoilModal}
          onClose={() => setShowSoilModal(false)}
          onSoilSaved={() => fetchTelemetry(activeField.id)}
        />
      )}
    </div>
  );
};
