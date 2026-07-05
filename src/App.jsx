import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnalysisProvider } from './lib/AnalysisContext';
import { useSettings } from './lib/useSettings';
import Home from './pages/Home';

function AppContent() {
  const { settings, updateSetting, resetSettings } = useSettings();

  return (
    <AnalysisProvider settings={settings}>
      <div className={settings.theme === 'dark' ? 'dark' : ''}>
        <Home settings={settings} updateSetting={updateSetting} resetSettings={resetSettings} />
      </div>
    </AnalysisProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}
