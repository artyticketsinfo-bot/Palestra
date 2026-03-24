import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface ThemeContextType {
  themeColor: string;
  setThemeColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeColor, setThemeColor] = useState('#10b981');

  useEffect(() => {
    let unsubscribe: () => void;

    const setupListener = (user: any) => {
      if (!user) {
        setThemeColor('#10b981'); // Default
        return;
      }

      const docRef = doc(db, 'settings', user.uid);
      
      // Real-time listener
      unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.themeColor) {
            setThemeColor(data.themeColor);
          }
        } else {
          // If document doesn't exist, use default
          setThemeColor('#10b981');
        }
      });
    };

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (unsubscribe) unsubscribe();
      setupListener(user);
    });

    return () => {
      if (unsubscribe) unsubscribe();
      authUnsubscribe();
    };
  }, []);

  useEffect(() => {
    // Apply theme color to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeColor);
    
    // Generate some variations using color-mix for better UI
    root.style.setProperty('--primary-color-50', `color-mix(in srgb, ${themeColor}, white 95%)`);
    root.style.setProperty('--primary-color-100', `color-mix(in srgb, ${themeColor}, white 90%)`);
    root.style.setProperty('--primary-color-200', `color-mix(in srgb, ${themeColor}, white 80%)`);
    root.style.setProperty('--primary-color-400', `color-mix(in srgb, ${themeColor}, white 20%)`);
    root.style.setProperty('--primary-color-600', `color-mix(in srgb, ${themeColor}, black 10%)`);
    root.style.setProperty('--primary-color-700', `color-mix(in srgb, ${themeColor}, black 20%)`);
    root.style.setProperty('--primary-color-glow', `color-mix(in srgb, ${themeColor}, transparent 80%)`);
  }, [themeColor]);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};
