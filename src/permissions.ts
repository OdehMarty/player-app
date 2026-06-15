import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

interface AllFilesAccessPlugin {
  hasManageExternalStorage(): Promise<{ granted: boolean }>;
  openManageExternalStorageSettings(): Promise<void>;
}

const AllFilesAccess = registerPlugin<AllFilesAccessPlugin>('AllFilesAccess');
const PERMISSION_PROMPT_KEY = 'boxplayer_manage_external_storage_prompted';

export const ensureManageExternalStoragePermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return true;

  const { granted } = await AllFilesAccess.hasManageExternalStorage();
  if (granted) return true;

  const { value: alreadyPrompted } = await Preferences.get({ key: PERMISSION_PROMPT_KEY });
  if (!alreadyPrompted) {
    await Preferences.set({ key: PERMISSION_PROMPT_KEY, value: 'true' });
    await AllFilesAccess.openManageExternalStorageSettings();
  }

  return false;
};
