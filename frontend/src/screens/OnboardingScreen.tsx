import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Field, UserProfile } from '../types';
import { FarmerOnboarding } from '../components/FarmerOnboarding';

export const OnboardingScreen: React.FC = () => {
  const { navigate } = useRouter();
  const { language, tamilDialect } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    api.getUserProfile().then((p) => {
      if (p) setProfile(p);
    }).catch(() => {});
  }, []);

  const handleFieldCreated = (newField: Field) => {
    localStorage.setItem('kisan_onboarded', 'true');
    localStorage.setItem('kisan_welcomed', 'true');
    navigate('home');
  };

  const handleClose = () => {
    // If user cancels during first-time onboarding, go back to login
    const isOnboarded = localStorage.getItem('kisan_onboarded') === 'true';
    if (isOnboarded) {
      navigate('home');
    } else {
      navigate('login');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-center items-center p-3 sm:p-6">
      <div className="w-full max-w-4xl my-auto">
        <FarmerOnboarding
          isOpen={true}
          inline={true}
          onClose={handleClose}
          onFieldCreated={handleFieldCreated}
          existingFieldsCount={0}
          initialLanguage={language}
          initialTamilDialect={tamilDialect}
        />
      </div>
    </div>
  );
};
