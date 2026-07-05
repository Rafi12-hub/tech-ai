import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useAnalysis } from '../../lib/AnalysisContext';

const summaryTypes = [
  { key: 'summary_30s', label: '30-Second Summary', desc: 'Quick overview (2-3 sentences)' },
  { key: 'summary_executive', label: 'Executive Summary', desc: 'For leadership (1 paragraph)' },
  { key: 'summary_detailed', label: 'Detailed Summary', desc: 'Comprehensive (multi-paragraph)' },
  { key: 'summary_bullet', label: 'Bullet Summary', desc: 'Key points (5-8 bullets)' }
];

function SummaryCard({ title, description, content, type }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = Array.isArray(content) ? content.join('\n') : content;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-card transition-all"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
        </button>
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {Array.isArray(content) ? (
          <ul className="list-disc list-inside space-y-1.5">
            {content.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {item}
              </motion.li>
            ))}
          </ul>
        ) : (
          content.split('\n').map((p, i) => (
            <p key={i} className={i > 0 ? 'mt-3' : ''}>{p}</p>
          ))
        )}
      </div>
    </motion.div>
  );
}

export default function SummaryTab() {
  const { analysis } = useAnalysis();
  const [activeType, setActiveType] = useState('summary_30s');
  const [showSections, setShowSections] = useState(false);

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-card flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">No analysis yet</h3>
        <p className="text-sm text-slate-400 mt-1">Upload a document to see summaries</p>
      </div>
    );
  }

  const summaryKeys = ['summary_30s', 'summary_executive', 'summary_detailed', 'summary_bullet'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Summary</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Multi-level summaries of your document</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {summaryTypes.map(type => (
          <button
            key={type.key}
            onClick={() => setActiveType(type.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeType === type.key
                ? 'bg-accent text-white shadow-lg shadow-accent/25'
                : 'glass text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-card'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <SummaryCard
            title={summaryTypes.find(t => t.key === activeType)?.label}
            description={summaryTypes.find(t => t.key === activeType)?.desc}
            content={analysis[activeType]}
            type={activeType}
          />
        </motion.div>
      </AnimatePresence>

      {analysis.section_summaries?.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowSections(!showSections)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            {showSections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Section-wise Summaries ({analysis.section_summaries.length})
          </button>

          <AnimatePresence>
            {showSections && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {analysis.section_summaries.map((section, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl p-4"
                  >
                    <h4 className="text-sm font-semibold text-accent mb-1">{section.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{section.summary}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
