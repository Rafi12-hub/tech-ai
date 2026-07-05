import { motion } from 'framer-motion';
import { Sun, Moon, RotateCcw } from 'lucide-react';

const MODELS = [
  { id: 'gemini-flash', name: 'Gemini 3 Flash' },
  { id: 'gemini-pro', name: 'Gemini 3.1 Pro' },
  { id: 'gpt-mini', name: 'GPT-5 Mini' },
  { id: 'gpt', name: 'GPT-5' },
  { id: 'claude-sonnet', name: 'Claude Sonnet 4.6' },
  { id: 'claude-opus', name: 'Claude Opus 4.8' }
];

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];

export default function SettingsTab({ settings, updateSetting, resetSettings }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure AI behavior and preferences</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">AI Model</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => updateSetting('model', model.id)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  settings.model === model.id
                    ? 'bg-accent text-white shadow-lg shadow-accent/25'
                    : 'bg-slate-100 dark:bg-dark-card text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Summary Length
            </label>
            <select
              value={settings.summaryLength}
              onChange={e => updateSetting('summaryLength', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm focus:ring-2 focus:ring-accent focus:outline-none"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Output Language
            </label>
            <select
              value={settings.language}
              onChange={e => updateSetting('language', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm focus:ring-2 focus:ring-accent focus:outline-none"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span>Creativity</span>
              <span className="text-accent">{settings.creativity.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.creativity}
              onChange={e => updateSetting('creativity', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span>Temperature</span>
              <span className="text-accent">{settings.temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={e => updateSetting('temperature', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span>Chunk Size (chars)</span>
              <span className="text-accent">{settings.chunkSize}</span>
            </label>
            <input
              type="range"
              min="500"
              max="3000"
              step="100"
              value={settings.chunkSize}
              onChange={e => updateSetting('chunkSize', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass rounded-2xl p-6 space-y-4">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Appearance</label>
        <div className="flex gap-3">
          <button
            onClick={() => updateSetting('theme', 'light')}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
              settings.theme === 'light'
                ? 'bg-accent text-white shadow-lg shadow-accent/25'
                : 'bg-slate-100 dark:bg-dark-card text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sun className="w-5 h-5" /> Light
          </button>
          <button
            onClick={() => updateSetting('theme', 'dark')}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
              settings.theme === 'dark'
                ? 'bg-accent text-white shadow-lg shadow-accent/25'
                : 'bg-slate-100 dark:bg-dark-card text-slate-700 dark:text-slate-300'
            }`}
          >
            <Moon className="w-5 h-5" /> Dark
          </button>
          <button
            onClick={resetSettings}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-slate-100 dark:bg-dark-card text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all ml-auto"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </motion.div>
    </div>
  );
}
