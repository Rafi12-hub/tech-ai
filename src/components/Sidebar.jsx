import { motion } from 'framer-motion';
import {
  Upload, FileText, Lightbulb, MessageSquare, GitCompare,
  Network, BarChart3, Download, Settings
} from 'lucide-react';
import { useAnalysis } from '../lib/AnalysisContext';

const iconMap = {
  Upload, FileText, Lightbulb, MessageSquare, GitCompare,
  Network, BarChart3, Download, Settings
};

export default function Sidebar({ tabs }) {
  const { activeTab, setActiveTab, currentDoc } = useAnalysis();

  const isDisabled = (tabId) => {
    if (tabId === 0 || tabId === 8) return false;
    return !currentDoc;
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="glass-strong flex flex-col flex-1 border-r border-slate-200 dark:border-dark-border">
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200 dark:border-dark-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">TechBrief AI</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Report Assistant</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = iconMap[tab.icon] || FileText;
              const disabled = isDisabled(tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => !disabled && setActiveTab(tab.id)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-accent/10 to-accent-secondary/10 text-accent dark:text-accent-secondary shadow-sm'
                      : disabled
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-card hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-accent dark:text-accent-secondary' : ''}`} />
                  <span>{tab.name}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-accent dark:bg-accent-secondary"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-6 py-4 border-t border-slate-200 dark:border-dark-border">
            <p className="text-xs text-slate-400 dark:text-slate-500">TechBrief AI v1.0</p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-slate-200 dark:border-dark-border safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = iconMap[tab.icon] || FileText;
            const disabled = isDisabled(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => !disabled && setActiveTab(tab.id)}
                disabled={disabled}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all min-w-[48px] ${
                  activeTab === tab.id
                    ? 'text-accent dark:text-accent-secondary'
                    : disabled
                      ? 'text-slate-300 dark:text-slate-700'
                      : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-accent dark:text-accent-secondary' : ''}`} />
                <span className="truncate max-w-full">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
