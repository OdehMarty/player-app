import { useEffect, useState } from 'react';
import { ensureManageExternalStoragePermission } from './permissions';
import './styles.css';

export default function App() {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    ensureManageExternalStoragePermission().then(setPermissionGranted).catch(() => setPermissionGranted(false));
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ fontSize: 15, fontWeight: 500 }}>BoxPlayer</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
        {permissionGranted === null && 'Checking video storage access...'}
        {permissionGranted === true && 'Ready to scan MovieBox, social downloads, and phone videos.'}
        {permissionGranted === false && 'Allow all files access in Android settings to scan local videos.'}
      </p>
    </main>
  );
}
