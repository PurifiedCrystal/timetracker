/**
 * Language Switcher Component
 *
 * Dropdown component for manual language selection
 * Shows current language and allows switching to other supported languages
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface LanguageSwitcherProps {
  /** Show as compact button (for navigation bar) */
  compact?: boolean;
  /** Custom CSS classes */
  className?: string;
}

export function LanguageSwitcher({ compact = false, className = '' }: LanguageSwitcherProps) {
  const { currentLanguage, supportedLanguages, isLoading, changeLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = async (languageCode: string) => {
    setIsOpen(false);

    if (languageCode === currentLanguage) {
      return; // No change needed
    }

    try {
      await changeLanguage(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
      // TODO: Show user-friendly error message
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-language-switcher]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (compact) {
    return (
      <div className={`relative ${className}`} data-language-switcher>
        <button
          onClick={toggleDropdown}
          disabled={isLoading}
          className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
          title={t('language.switchLanguage', 'Switch Language')}
        >
          <span className="hidden sm:inline">{currentLang?.code.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="py-1">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                    lang.code === currentLanguage ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span>{lang.name}</span>
                  {lang.code === currentLanguage && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full-size version for settings page
  return (
    <div className={`${className}`} data-language-switcher>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Globe className="h-4 w-4 inline mr-1" />
        {t('settings.language', 'Language')}
      </label>

      <div className="relative">
        <button
          onClick={toggleDropdown}
          disabled={isLoading}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        >
          <div className="flex items-center space-x-2">
            <span>{currentLang?.name || 'Unknown'}</span>
          </div>

          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="py-1 max-h-60 overflow-y-auto">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${
                    lang.code === currentLanguage ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{lang.name}</span>
                      <span className="text-xs text-gray-500">{lang.englishName}</span>
                    </div>
                  </div>

                  {lang.code === currentLanguage && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <p className="mt-1 text-sm text-gray-500">
          {t('language.switchingLanguage', 'Switching language...')}
        </p>
      )}
    </div>
  );
}