import { useState, useEffect, useCallback } from 'react';

const DEFAULTS = {
  model: 'gemini-flash',
  summaryLength: 'medium',
  creativity: 0.5,
  temperature: 0.3,
  chunkSize: 2000,
  language: 'English',
  theme: 'dark'
};

export function useSettings() {
  const [settings, setSettingsState] = useState(() => {
    try {
      const stored = localStorage.getItem('techbrief-settings');
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('techbrief-settings', JSON.stringify(settings));

    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettingsState(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULTS);
  }, []);

  return { settings, updateSetting, resetSettings };
}
