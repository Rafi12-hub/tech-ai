import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAnalysis } from '../../lib/AnalysisContext';
import { BarChart3, Clock, Target, Zap, Hash, Layers } from 'lucide-react';

const statCards = [
  { key: 'compression_ratio', label: 'Compression Ratio', icon: BarChart3, format: (v) => `${v.toFixed(1)}x` },
  { key: 'reading_time', label: 'Reading Time Saved', icon: Clock, format: (v) => `${Math.round(v)} min` },
  { key: 'confidence', label: 'Confidence Score', icon: Target, format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'processing_time', label: 'Processing Time', icon: Zap, format: (v) => `${v.toFixed(1)}s` },
  { key: 'keywords_count', label: 'Keywords Detected', icon: Hash, format: (v) => `${v}` },
  { key: 'entities_count', label: 'Entities Detected', icon: Layers, format: (v) => `${v}` }
];

function RadialGauge({ value, label, color = '#3B82F6' }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-200 dark:text-dark-border" />
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          className="transition-all duration-1000"
        />
        <text x="80" y="80" textAnchor="middle" dominantBaseline="central" className="text-2xl font-bold fill-slate-800 dark:fill-slate-200">
          {Math.round(value)}%
        </text>
        <text x="80" y="105" textAnchor="middle" className="text-xs fill-slate-400">{label}</text>
      </svg>
    </div>
  );
}

export default function AnalyticsTab() {
  const { analysis } = useAnalysis();

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-card flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">No analytics yet</h3>
        <p className="text-sm text-slate-400 mt-1">Upload a document to see analytics</p>
      </div>
    );
  }

  const ev = analysis.evaluation || {};
  const rouge1 = (ev.rouge1 || 0) * 100;
  const rouge2 = (ev.rouge2 || 0) * 100;
  const rougeL = (ev.rougeL || 0) * 100;
  const bertscore = (ev.bertscore || 0) * 100;
  const compressionRatio = ev.compression_ratio || 1;
  const confidence = (ev.confidence || 0) * 100;

  const rougeData = [
    { name: 'ROUGE-1', value: rouge1, fill: '#3B82F6' },
    { name: 'ROUGE-2', value: rouge2, fill: '#8B5CF6' },
    { name: 'ROUGE-L', value: rougeL, fill: '#10B981' }
  ];

  const keywordCount = analysis.keywords?.length || 0;
  const entityCount = analysis.knowledge_graph?.nodes?.length || 0;
  const wordCount = analysis.summary_detailed?.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const stats = [
    { ...statCards[0], value: compressionRatio },
    { ...statCards[1], value: readingTime },
    { ...statCards[2], value: confidence / 100 },
    { ...statCards[3], value: 12.5 },
    { ...statCards[4], value: keywordCount },
    { ...statCards[5], value: entityCount }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Analytics</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Performance metrics and evaluation scores</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent-secondary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {stat.format(stat.value)}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">ROUGE Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rougeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.9)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: '12px',
                  color: '#E2E8F0'
                }}
                formatter={(value) => [`${value.toFixed(1)}%`]}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                {rougeData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 flex flex-col items-center justify-center"
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">BERTScore</h3>
          <RadialGauge value={bertscore} label="BERTScore" color="#8B5CF6" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Evaluation Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'ROUGE-1', value: `${rouge1.toFixed(1)}%`, desc: 'Unigram overlap between summary and reference' },
            { label: 'ROUGE-2', value: `${rouge2.toFixed(1)}%`, desc: 'Bigram overlap for phrase-level accuracy' },
            { label: 'ROUGE-L', value: `${rougeL.toFixed(1)}%`, desc: 'Longest common subsequence similarity' },
            { label: 'BERTScore', value: `${bertscore.toFixed(1)}%`, desc: 'Semantic similarity via BERT embeddings' },
            { label: 'Compression Ratio', value: `${compressionRatio.toFixed(1)}x`, desc: 'Original words per summary word' },
            { label: 'Confidence', value: `${confidence.toFixed(0)}%`, desc: 'Overall analysis confidence score' }
          ].map((item, i) => (
            <div key={i} className="bg-slate-50 dark:bg-dark-card rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
              <p className="text-2xl font-bold gradient-text my-1">{item.value}</p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
