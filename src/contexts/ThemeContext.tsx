// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Background colors
  background: string;
  surface: string;
  surfaceVariant: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Border and divider
  border: string;
  divider: string;

  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;

  // Card colors
  cardBackground: string;
  cardBorder: string;

  // Input colors
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;

  // Button colors
  buttonPrimary: string;
  buttonSecondary: string;
  buttonDisabled: string;

  // Gradient colors
  gradientStart: string;
  gradientEnd: string;
}

const lightTheme: ThemeColors = {
  primary: '#047603', // Dark green primary
  primaryLight: '#047603',
  primaryDark: '#035a03',

  background: '#fafafa',
  surface: '#ffffff',
  surfaceVariant: '#f5f5f5',

  text: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',

  border: '#e2e8f0',
  divider: '#f1f5f9',

  success: '#047603',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  cardBackground: '#ffffff',
  cardBorder: '#e2e8f0',

  inputBackground: '#ffffff',
  inputBorder: '#d1d5db',
  inputPlaceholder: '#9ca3af',

  buttonPrimary: '#047603',
  buttonSecondary: '#f1f5f9',
  buttonDisabled: '#d1d5db',

  gradientStart: '#047603',
  gradientEnd: '#0a8f0a',
};

const darkTheme: ThemeColors = {
  primary: '#055E03', // Same dark green primary
  primaryLight: '#046804',
  primaryDark: '#035a03',

  background: '#000000', // Darker background for dark mode
  surface: '#0A180A',
  surfaceVariant: '#2a4a2a',

  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textTertiary: '#64748b',

  border: '#2a4a2a',
  divider: '#1a3a1a',

  success: '#047603',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',

  cardBackground: '#1a3a1a',
  cardBorder: '#2a4a2a',

  inputBackground: '#1a3a1a',
  inputBorder: '#2a4a2a',
  inputPlaceholder: '#64748b',

  buttonPrimary: '#047603',
  buttonSecondary: '#2a4a2a',
  buttonDisabled: '#1a3a1a',

  gradientStart: '#012201',
  gradientEnd: '#035a03',
};

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode && ['light', 'dark'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme mode:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadThemeMode();
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem('themeMode', mode).catch((error) => {
      console.error('Failed to save theme mode:', error);
    });
  };

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;
  const isDark = themeMode === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        isDark,
      }}
    >
      {isReady ? children : null}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};