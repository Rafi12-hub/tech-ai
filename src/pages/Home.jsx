import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import UploadTab from '../components/tabs/UploadTab';
import SummaryTab from '../components/tabs/SummaryTab';
import InsightsTab from '../components/tabs/InsightsTab';
import ChatTab from '../components/tabs/ChatTab';
import CompareTab from '../components/tabs/CompareTab';
import KnowledgeGraphTab from '../components/tabs/KnowledgeGraphTab';
import AnalyticsTab from '../components/tabs/AnalyticsTab';
import ExportTab from '../components/tabs/ExportTab';
import SettingsTab from '../components/tabs/SettingsTab';
import { useAnalysis } from '../lib/AnalysisContext';
import { SidebarProvider } from '../lib/SidebarProvider';

const tabs = [
  { id: 0, name: 'Upload', icon: 'Upload' },
  { id: 1, name: 'Summary', icon: 'FileText' },
  { id: 2, name: 'Insights', icon: 'Lightbulb' },
  { id: 3, name: 'Chat', icon: 'MessageSquare' },
  { id: 4, name: 'Compare', icon: 'GitCompare' },
  { id: 5, name: 'Knowledge Graph', icon: 'Network' },
  { id: 6, name: 'Analytics', icon: 'BarChart3' },
  { id: 7, name: 'Export', icon: 'Download' },
  { id: 8, name: 'Settings', icon: 'Settings' }
];

const tabVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

function TabContent({ tabId, settings, updateSetting, resetSettings }) {
  switch (tabId) {
    case 0: return <UploadTab />;
    case 1: return <SummaryTab />;
    case 2: return <InsightsTab />;
    case 3: return <ChatTab />;
    case 4: return <CompareTab />;
    case 5: return <KnowledgeGraphTab />;
    case 6: return <AnalyticsTab />;
    case 7: return <ExportTab />;
    case 8: return <SettingsTab settings={settings} updateSetting={updateSetting} resetSettings={resetSettings} />;
    default: return <UploadTab />;
  }
}

export default function Home({ settings, updateSetting, resetSettings }) {
  const { activeTab } = useAnalysis();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Sidebar tabs={tabs} />

        <main className="lg:pl-[--sidebar-width] pb-16 lg:pb-0 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <TabContent
                  tabId={activeTab}
                  settings={settings}
                  updateSetting={updateSetting}
                  resetSettings={resetSettings}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
