import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { GymSettings } from '../types';

interface GymContextType {
  settings: GymSettings;
  loading: boolean;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export function GymProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GymSettings>({
    name: 'GymMaster',
    email: '',
    phone: '',
    website: '',
    address: '',
    themeColor: '#10b981'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'settings', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as GymSettings;
        setSettings(prev => ({
          ...prev,
          ...data,
          // Explicitly handle logoUrl removal if it's missing in data
          logoUrl: data.logoUrl || undefined
        }));
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching gym settings:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  return (
    <GymContext.Provider value={{ settings, loading }}>
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  const context = useContext(GymContext);
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
}
