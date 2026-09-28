import React from 'react';
import { RouterProvider, useRouter } from './router/RouterContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppShell } from './components/layout/AppShell';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { FieldsScreen } from './screens/FieldsScreen';
import { FieldDetailScreen } from './screens/FieldDetailScreen';
import { AddFieldScreen } from './screens/AddFieldScreen';
import { CheckCropScreen } from './screens/CheckCropScreen';
import { AskFieldScreen } from './screens/AskFieldScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AlertsScreen } from './screens/AlertsScreen';
import { NetworkProvider } from './context/NetworkContext';

const ScreenContent: React.FC = () => {
  const { currentRoute } = useRouter();

  switch (currentRoute) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'login':
      return <LoginScreen />;
    case 'onboarding':
      return <OnboardingScreen />;
    case 'home':
      return <HomeScreen />;
    case 'fields':
      return <FieldsScreen />;
    case 'field-detail':
      return <FieldDetailScreen />;
    case 'add-field':
      return <AddFieldScreen />;
    case 'check-crop':
      return <CheckCropScreen />;
    case 'ask-field':
      return <AskFieldScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'alerts':
      return <AlertsScreen />;
    default:
      return <HomeScreen />;
  }
};

export const App: React.FC = () => {
  return (
    <RouterProvider>
      <LanguageProvider>
        <NetworkProvider>
          <AppShell>
            <ScreenContent />
          </AppShell>
        </NetworkProvider>
      </LanguageProvider>
    </RouterProvider>
  );
};

export default App;
