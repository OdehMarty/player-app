import { useAllFilesAccess } from './hooks/useAllFilesAccess';

function App() {
  const { granted, checking, requestAllFilesAccess } = useAllFilesAccess();

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Local video library</p>
        <h1>BoxPlayer</h1>
        <p className="body-copy">
          Scan MovieBox downloads, phone videos, and BoxPlayer social downloads from one dark media library.
        </p>

        <div className="permission-panel">
          <div>
            <p className="panel-title">All files access</p>
            <p className="panel-copy">
              {checking && 'Checking Android storage access...'}
              {!checking && granted && 'Storage access is enabled. BoxPlayer can scan local videos.'}
              {!checking && !granted && 'Enable all files access so BoxPlayer can find downloaded videos.'}
            </p>
          </div>
          <button type="button" onClick={requestAllFilesAccess} disabled={checking || granted}>
            {granted ? 'Enabled' : 'Open settings'}
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;
