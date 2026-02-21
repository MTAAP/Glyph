import { useEffect } from 'react';
import { useAppStore } from '@/features/settings/store';

export function useUrlParams() {
  useEffect(() => {
    // Check for settings in URL on mount
    const params = new URLSearchParams(window.location.search);
    const encodedSettings = params.get('settings');

    if (encodedSettings) {
      try {
        const decodedString = atob(encodedSettings);
        const parsedSettings = JSON.parse(decodedString);
        useAppStore.getState().updateSettings(parsedSettings);
        
        // Optional: clear the URL after applying
        window.history.replaceState({}, '', window.location.pathname);
        useAppStore.getState().addToast({ type: 'info', message: 'Shared settings applied' });
      } catch (e) {
        console.error('Failed to parse settings from URL', e);
        useAppStore.getState().addToast({ type: 'error', message: 'Failed to apply shared settings' });
      }
    }
  }, []);
}
