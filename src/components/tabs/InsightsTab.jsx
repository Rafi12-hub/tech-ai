import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAnalysis } from '../../lib/AnalysisContext';

const categories = [
  { key: 'key_findings', label: 'Key Findings', color: 'blue', border: 'border-l-accent' },
  { key: 'action_items', label: 'Action Items', color: 'emerald', border: 'border-l-emerald-500' },
  { key: 'risks', label: 'Risks', color: 'red', border: 'border-l-red-500' },
  { key: 'recommendations', label: 'Recommendations', color: 'violet', border: 'border-l-accent-secondary' }
];

const metricColors = {
  percentage: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  date: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  accuracy: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  performance: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  cost: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
};

const typeIcons = {
  milestone: '◆',
  phase: '●',
  deadline: '▲'
};

const typeColors = {
  milestone: 'text-accent border-accent',
  phase: 'text-emerald-500 border-emerald-500',
  deadline: 'text-amber-500 border-amber-500'
};

export default function InsightsTab() {
  const { analysis } = useAnalysis();
  const [activeCategory, setActiveCategory] = useState(0);

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-card flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">No insights yet</h3>
        <p className="text-sm text-slate-400 mt-1">Upload a document to generate insights</p>
      </div>
    );
  }

  const cat = categories[activeCategory];
  const items = analysis[cat.key] || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Insights</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Deep analysis and extracted intelligence</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat, i) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(i)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeCategory === i
                ? 'bg-accent text-white shadow-lg shadow-accent/25'
                : 'glass text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-card'
            }`}
          >
            {cat.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeCategory === i ? 'bg-white/20' : 'bg-slate-200 dark:bg-dark-border'
            }`}>
              {items.length}
            </span>
          </button>
        ))}
      </div>

      <motion.div key={cat.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass rounded-xl p-4 border-l-4 ${cat.border} flex items-start gap-3`}
          >
            <span className="text-xs font-bold text-slate-400 mt-0.5 min-w-[20px]">{i + 1}.</span>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item}</p>
          </motion.div>
        ))}
      </motion.div>

      {analysis.metrics?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Important Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.metrics.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4"
              >
                <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{metric.value}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-2 ${
                  metricColors[metric.category] || metricColors.performance
                }`}>
                  {metric.category}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {analysis.keywords?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Technical Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((kw, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent dark:text-accent-secondary border border-accent/20"
              >
                {kw}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {analysis.glossary?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Glossary</h3>
          <div className="glass rounded-2xl overflow-hidden">
            {analysis.glossary.map((item, i) => (
              <div key={i} className={`px-4 py-3 ${i > 0 ? 'border-t border-slate-100 dark:border-dark-border' : ''}`}>
                <p className="text-sm font-semibold text-accent">{item.term}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.definition}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {analysis.timeline?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Timeline & Milestones</h3>
          <div className="space-y-0">
            {analysis.timeline.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${typeColors[item.type] || 'border-slate-300 text-slate-400'}`}>
                    {typeIcons[item.type] || '●'}
                  </div>
                  {i < analysis.timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-dark-border" />}
                </div>
                <div className={`pb-6 ${i < analysis.timeline.length - 1 ? '' : ''}`}>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.event}</p>
                  <p className="text-xs text-slate-400">{item.date}</p>
                  <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">{item.type}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
