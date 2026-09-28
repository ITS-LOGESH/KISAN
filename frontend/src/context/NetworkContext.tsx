import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface NetworkContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  setIsSyncing: (syncing: boolean) => void;
  recordSync: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('kisan_last_sync_time');
    return saved ? parseInt(saved, 10) : Date.now();
  });

  const recordSync = useCallback(() => {
    const now = Date.now();
    setLastSyncTime(now);
    localStorage.setItem('kisan_last_sync_time', now.toString());
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      recordSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [recordSync]);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isSyncing,
        lastSyncTime,
        setIsSyncing,
        recordSync
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
