import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type RouteName =
  | 'welcome'
  | 'login'
  | 'onboarding'
  | 'home'
  | 'fields'
  | 'field-detail'
  | 'add-field'
  | 'check-crop'
  | 'ask-field'
  | 'profile'
  | 'settings'
  | 'alerts';

export interface RouteParams {
  fieldId?: number;
  [key: string]: any;
}

interface RouterContextType {
  currentRoute: RouteName;
  params: RouteParams;
  navigate: (route: RouteName, params?: RouteParams) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

// Parse the current window.location.hash into route & params
function parseHash(hash: string): { route: RouteName; params: RouteParams } {
  const clean = hash.replace(/^#\/?/, '').trim();
  const isOnboarded = localStorage.getItem('kisan_onboarded') === 'true';

  if (!clean) {
    return { route: isOnboarded ? 'home' : 'welcome', params: {} };
  }

  const parts = clean.split('/');
  const routeCandidate = parts[0] as RouteName;

  // Handle /fields/:id
  if (routeCandidate === 'fields' && parts[1]) {
    const id = parseInt(parts[1], 10);
    if (!isNaN(id)) {
      return { route: 'field-detail', params: { fieldId: id } };
    }
  }

  const validRoutes: RouteName[] = [
    'welcome',
    'login',
    'onboarding',
    'home',
    'fields',
    'field-detail',
    'add-field',
    'check-crop',
    'ask-field',
    'profile',
    'settings',
    'alerts',
  ];

  if (validRoutes.includes(routeCandidate)) {
    // If not onboarded and trying to access main app pages directly, redirect to welcome
    if (!isOnboarded && !['welcome', 'login', 'onboarding'].includes(routeCandidate)) {
      return { route: 'welcome', params: {} };
    }
    return { route: routeCandidate, params: {} };
  }

  return { route: isOnboarded ? 'home' : 'welcome', params: {} };
}

// Format route + params into hash
function formatHash(route: RouteName, params?: RouteParams): string {
  if (route === 'field-detail' && params?.fieldId) {
    return `#/fields/${params.fieldId}`;
  }
  return `#/${route}`;
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [routeState, setRouteState] = useState<{ route: RouteName; params: RouteParams }>(() =>
    parseHash(window.location.hash)
  );

  useEffect(() => {
    const handleHashChange = () => {
      setRouteState(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    // If hash was initially empty, set it to the parsed default
    if (!window.location.hash) {
      window.location.hash = formatHash(routeState.route, routeState.params);
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((route: RouteName, params?: RouteParams) => {
    if (route === 'home') {
      localStorage.setItem('kisan_welcomed', 'true');
    }
    const newHash = formatHash(route, params);
    if (window.location.hash === newHash) {
      setRouteState({ route, params: params || {} });
    } else {
      window.location.hash = newHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      const isOnboarded = localStorage.getItem('kisan_onboarded') === 'true';
      navigate(isOnboarded ? 'home' : 'welcome');
    }
  }, [navigate]);

  return (
    <RouterContext.Provider
      value={{
        currentRoute: routeState.route,
        params: routeState.params,
        navigate,
        goBack,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
