import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, ArrowLeftRight, Upload, FileText, AlertCircle } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { storage, db } from '../../lib/firebase';
import { useAnalysis } from '../../lib/AnalysisContext';

export default function CompareTab() {
  const { currentDoc, documents, compareDocuments, compareResult, setCompareResult, uploadAndAnalyze } = useAnalysis();
  const [selectedDoc, setSelectedDoc] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [tempDocId, setTempDocId] = useState(null);
  const inputRef = useRef(null);

  const handleCompare = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    await compareDocuments(selectedDoc);
    setLoading(false);
  };

  const handleNewCompare = () => {
    setCompareResult(null);
    setSelectedDoc('');
    setTempDocId(null);
    setUploadMode(false);
  };

  const handleUploadForCompare = useCallback(async (file) => {
    setUploadLoading(true);
    try {
      await uploadAndAnalyze(file);
      setUploadMode(false);
    } catch (e) {
      console.error('Upload error:', e);
    } finally {
      setUploadLoading(false);
    }
  }, [uploadAndAnalyze]);

  if (!currentDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-card flex items-center justify-center mb-4">
          <GitCompare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">No document selected</h3>
        <p className="text-sm text-slate-400 mt-1">Upload a document first, then compare with another</p>
      </div>
    );
  }

  if (compareResult) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold gradient-text">Document Comparison</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Side-by-side analysis</p>
          </div>
          <button onClick={handleNewCompare} className="glass px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-card transition-all flex items-center gap-2">
            <Upload className="w-4 h-4" /> Compare Another
          </button>
        </div>

        <div className="glass rounded-2xl p-6 flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{compareResult.doc1.filename}</p>
          </div>
          <ArrowLeftRight className="w-6 h-6 text-accent mx-4 flex-shrink-0" />
          <div className="text-center flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{compareResult.doc2.filename}</p>
          </div>
        </div>

        {compareResult.similarities?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 border-l-4 border-emerald-500">
            <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-3">Similarities</h3>
            <ul className="space-y-2">
              {compareResult.similarities.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span> {s}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {compareResult.differences?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass rounded-2xl p-6 border-l-4 border-amber-500">
            <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-3">Differences</h3>
            <ul className="space-y-2">
              {compareResult.differences.map((d, i) => (
                <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">&#9888;</span> {d}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {compareResult.comparative_summary && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Comparative Summary</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{compareResult.comparative_summary}</p>
          </motion.div>
        )}

        {compareResult.comparison_table?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Comparison Table</h3>
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-border">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Aspect</th>
                    <th className="text-left px-4 py-3 font-semibold text-accent">{compareResult.doc1.filename}</th>
                    <th className="text-left px-4 py-3 font-semibold text-accent-secondary">{compareResult.doc2.filename}</th>
                  </tr>
                </thead>
                <tbody>
                  {compareResult.comparison_table.map((row, i) => (
                    <tr key={i} className={i < compareResult.comparison_table.length - 1 ? 'border-b border-slate-100 dark:border-dark-border' : ''}>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{row.aspect}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.document1}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.document2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Compare Documents</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Upload or select a second document to compare</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-dark-card rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <span className="text-sm font-bold text-accent">1</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{currentDoc.filename}</p>
            <p className="text-xs text-slate-400">Current document</p>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowLeftRight className="w-6 h-6 text-slate-400" />
        </div>

        {uploadMode ? (
          <div
            onClick={() => !uploadLoading && inputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-dark-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/50 transition-all"
          >
            <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,.txt" onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleUploadForCompare(file);
            }} className="hidden" />
            {uploadLoading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                Uploading...
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Click to upload a document</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select a document to compare with
            </label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-sm focus:ring-2 focus:ring-accent focus:outline-none"
            >
              <option value="">Choose a document...</option>
              {documents.filter(d => d.id !== currentDoc.id).map(doc => (
                <option key={doc.id} value={doc.id}>{doc.filename}</option>
              ))}
            </select>
            <button
              onClick={() => setUploadMode(true)}
              className="text-sm text-accent hover:underline flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Or upload a new document
            </button>
          </div>
        )}

        {!uploadMode && (
          <button
            onClick={handleCompare}
            disabled={!selectedDoc || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <GitCompare className="w-4 h-4" />
            )}
            {loading ? 'Comparing...' : 'Compare Documents'}
          </button>
        )}
      </div>
    </div>
  );
}
