import { useCallback, useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';

interface AllFilesAccessPlugin {
  hasManageExternalStorage(): Promise<{ granted: boolean }>;
  openManageExternalStorageSettings(): Promise<void>;
}

const AllFilesAccess = registerPlugin<AllFilesAccessPlugin>('AllFilesAccess');
const PROMPTED_KEY = 'boxplayer.manageExternalStoragePrompted';

export interface UseAllFilesAccessResult {
  granted: boolean;
  checking: boolean;
  error: string | null;
  requestAllFilesAccess: () => Promise<void>;
  refreshAllFilesAccess: () => Promise<boolean>;
}

export const useAllFilesAccess = (): UseAllFilesAccessResult => {
  const [granted, setGranted] = useState(!Capacitor.isNativePlatform());
  const [checking, setChecking] = useState(Capacitor.isNativePlatform());
  const [error, setError] = useState<string | null>(null);

  const refreshAllFilesAccess = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      setGranted(true);
      setChecking(false);
      return true;
    }

    setChecking(true);
    setError(null);

    try {
      const result = await AllFilesAccess.hasManageExternalStorage();
      setGranted(result.granted);
      return result.granted;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to check all files access.';
      setError(message);
      setGranted(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  const requestAllFilesAccess = useCallback(async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      setGranted(true);
      return;
    }

    setChecking(true);
    setError(null);

    try {
      await Preferences.set({ key: PROMPTED_KEY, value: 'true' });
      await AllFilesAccess.openManageExternalStorageSettings();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to open all files access settings.';
      setError(message);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshAllFilesAccess();

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void refreshAllFilesAccess();
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [refreshAllFilesAccess]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void Preferences.get({ key: PROMPTED_KEY }).then(({ value }) => {
      if (!value && !granted) {
        void requestAllFilesAccess();
      }
    });
  }, [granted, requestAllFilesAccess]);

  return {
    granted,
    checking,
    error,
    requestAllFilesAccess,
    refreshAllFilesAccess,
  };
};
