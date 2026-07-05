import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Clock, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { useAnalysis } from '../../lib/AnalysisContext';

const STAGES = [
  'Uploading file...',
  'Extracting text...',
  'Creating document record...',
  'Running AI analysis...',
  'Storing results...',
  'Analysis complete!'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function UploadTab() {
  const { uploadAndAnalyze, loading, progress, documents, loadDocument } = useAnalysis();
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [uploadQueue, setUploadQueue] = useState([]);
  const [completedUploads, setCompletedUploads] = useState([]);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'docx', 'doc', 'txt'];
    if (!validExts.includes(ext)) return 'Invalid file type. Please upload PDF, DOCX, DOC, or TXT files.';
    if (file.size > MAX_FILE_SIZE) return 'File too large. Maximum size is 50MB.';
    return null;
  };

  const handleFile = useCallback(async (file) => {
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }
    setError('');
    setUploadQueue(prev => [...prev, { name: file.name, status: 'uploading' }]);
    try {
      await uploadAndAnalyze(file);
      setCompletedUploads(prev => [...prev, file.name]);
    } catch (e) {
      setError(`Failed to process ${file.name}`);
    }
    setUploadQueue(prev => prev.filter(f => f.name !== file.name));
  }, [uploadAndAnalyze]);

  const handleFiles = useCallback((files) => {
    const fileArray = Array.from(files);
    fileArray.forEach(f => handleFile(f));
  }, [handleFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInput = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const stageIndex = progress.stage ? STAGES.indexOf(progress.stage) : -1;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Upload Document</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Drop technical reports to analyze</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
          dragOver
            ? 'border-accent bg-accent/5'
            : 'border-slate-300 dark:border-dark-border hover:border-accent/50'
        } ${loading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt" onChange={handleInput} className="hidden" />

        {loading ? (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-accent">{progress.stage}</span>
                <span className="text-slate-400">{progress.percent}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-dark-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="space-y-1.5">
                {STAGES.map((stage, i) => (
                  <div key={stage} className={`flex items-center gap-2 text-xs transition-all ${
                    i === stageIndex ? 'text-accent font-medium' : i < stageIndex ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      i === stageIndex ? 'bg-accent progress-animated' : i < stageIndex ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`} />
                    {stage}
                  </div>
                ))}
              </div>
            </div>
            {uploadQueue.length > 0 && (
              <div className="text-xs text-slate-400">
                Queue: {uploadQueue.length} file(s) waiting
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent/10 to-accent-secondary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                Drop your documents here
              </p>
              <p className="text-sm text-slate-400 mt-1">
                or click to browse &mdash; PDF, DOCX, DOC, TXT (max 50MB each)
              </p>
            </div>
          </div>
        )}

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-1 text-red-500 text-sm mt-4">
            <AlertCircle className="w-4 h-4" /> {error}
          </motion.p>
        )}
      </motion.div>

      {completedUploads.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2">
          {completedUploads.map((name, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
              <Check className="w-3 h-3" /> {name}
            </div>
          ))}
        </motion.div>
      )}

      {documents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        >
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Documents
          </h3>
          <div className="space-y-2">
            {documents.slice(0, 10).map((doc, i) => (
              <motion.button
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                onClick={() => loadDocument(doc.id)}
                className="w-full glass rounded-xl p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-dark-card/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent-secondary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-slate-400">
                    {doc.file_type?.toUpperCase()} &middot; {Math.round(doc.file_size / 1024)}KB
                    {doc.page_count ? ` &middot; ${doc.page_count} page(s)` : ''}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
