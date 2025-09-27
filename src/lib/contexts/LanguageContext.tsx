/**
 * Language Context Provider
 *
 * Manages language state and provides translation functionality across the app
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANGUAGE_CONFIG, isLanguageSupported } from '../types/language-config';
import { languageDetectionService } from '../services/language-detection';
import { translationLoaderService } from '../services/translation-loader';
import { loadUserPreferenceFromStorage, saveUserPreferenceToStorage } from '../types/preference';
import '../i18n'; // Initialize i18n

interface LanguageContextType {
  currentLanguage: string;
  supportedLanguages: Array<{
    code: string;
    name: string;
    englishName: string;
    flag: string;
  }>;
  isLoading: boolean;
  isDetecting: boolean;
  changeLanguage: (language: string) => Promise<void>;
  detectLanguage: () => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE_CONFIG.defaultLanguage);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const supportedLanguages = DEFAULT_LANGUAGE_CONFIG.supportedLanguages.map(lang => ({
    code: lang.code,
    name: lang.name,
    englishName: lang.englishName,
    flag: lang.flag
  }));

  // Initialize language on mount
  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    setIsDetecting(true);

    try {
      // Check for stored preference first
      const storedPreference = loadUserPreferenceFromStorage();

      if (storedPreference && isLanguageSupported(storedPreference.selectedLanguage)) {
        await changeLanguageInternal(storedPreference.selectedLanguage);
        setIsDetecting(false);
        return;
      }

      // Perform automatic detection
      const detectionResult = await languageDetectionService.detectLanguage();
      await changeLanguageInternal(detectionResult.detectedLanguage);

      // Save the detection result as user preference
      const preference = {
        selectedLanguage: detectionResult.detectedLanguage,
        autoDetection: true,
        lastUpdated: new Date().toISOString(),
        detectionHistory: []
      };
      saveUserPreferenceToStorage(preference);

    } catch (error) {
      console.error('Language initialization failed:', error);
      await changeLanguageInternal(DEFAULT_LANGUAGE_CONFIG.defaultLanguage);
    } finally {
      setIsDetecting(false);
    }
  };

  const changeLanguageInternal = async (language: string) => {
    if (!isLanguageSupported(language)) {
      console.warn(`Language ${language} not supported, falling back to default`);
      language = DEFAULT_LANGUAGE_CONFIG.defaultLanguage;
    }

    setIsLoading(true);

    try {
      // Change i18n language
      await i18n.changeLanguage(language);

      // Update translation loader
      await translationLoaderService.switchLanguage(language);

      // Update state
      setCurrentLanguage(language);

      console.log(`Language successfully changed to: ${language}`);
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (language: string) => {
    await changeLanguageInternal(language);

    // Save user preference
    const preference = {
      selectedLanguage: language,
      autoDetection: false, // Manual selection disables auto-detection
      lastUpdated: new Date().toISOString(),
      detectionHistory: []
    };
    saveUserPreferenceToStorage(preference);
  };

  const detectLanguage = async () => {
    setIsDetecting(true);

    try {
      const detectionResult = await languageDetectionService.forceRedetection();
      await changeLanguageInternal(detectionResult.detectedLanguage);

      // Update preference to enable auto-detection
      const preference = {
        selectedLanguage: detectionResult.detectedLanguage,
        autoDetection: true,
        lastUpdated: new Date().toISOString(),
        detectionHistory: []
      };
      saveUserPreferenceToStorage(preference);

    } catch (error) {
      console.error('Language detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    supportedLanguages,
    isLoading,
    isDetecting,
    changeLanguage,
    detectLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}