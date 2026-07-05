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
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:z-30 lg:w-[--sidebar-width] lg:flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold gradient-text truncate">TechBrief AI</h1>
              <p className="text-xs text-sidebar-foreground/70">Report Assistant</p>
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
                  data-active={activeTab === tab.id}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : disabled
                        ? 'text-sidebar-foreground/40 cursor-not-allowed'
                        : 'text-sidebar-foreground hover-bg-sidebar-accent hover-text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${activeTab === tab.id ? 'text-accent' : ''}`} />
                  <span className="truncate">{tab.name}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-accent"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-6 py-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/50">TechBrief AI v1.0</p>
          </div>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border safe-area-bottom">
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
                    ? 'text-accent'
                    : disabled
                      ? 'text-sidebar-foreground/40'
                      : 'text-sidebar-foreground/70'
                }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-accent' : ''}`} />
                <span className="truncate max-w-full">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
