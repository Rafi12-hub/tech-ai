import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { storage, db } from './firebase';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children, settings }) {
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ stage: '', percent: 0 });
  const [compareResult, setCompareResult] = useState(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    loadRecentDocuments();
  }, []);

  const loadRecentDocuments = async () => {
    try {
      const q = query(collection(db, 'documents'), orderBy('created_at', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocuments(docs);
    } catch (e) {
      if (e.code !== 'unavailable' && e.code !== 'permission-denied') {
        console.error('Error loading docs:', e);
      }
    }
  };

  const api = useCallback(async (endpoint, options = {}) => {
    const baseUrl = (import.meta.env.VITE_API_URL || '') + '/api';
    const url = `${baseUrl}${endpoint}`;
    if (options.method === 'POST' && options.body instanceof FormData) {
      const res = await fetch(url, { method: 'POST', body: options.body });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }, []);

  const uploadAndAnalyze = useCallback(async (file) => {
    setLoading(true);
    setProgress({ stage: 'Uploading file...', percent: 10 });
    const currentSettings = settingsRef.current;

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'txt';
      const docId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const storageRef = ref(storage, `documents/${docId}_${file.name}`);

      const uploadTask = uploadBytesResumable(storageRef, file);
      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.min(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 20) + 10, 30);
            setProgress({ stage: 'Uploading file...', percent: pct });
          },
          reject,
          resolve
        );
      });

      const fileUrl = await getDownloadURL(storageRef);
      setProgress({ stage: 'Extracting text...', percent: 30 });

      let rawText = '';
      let sections = [];
      let pageCount = 1;

      if (fileExt === 'txt') {
        rawText = await file.text();
        sections = [{ title: 'Document', content: rawText }];
      } else {
        try {
          const textForm = new FormData();
          textForm.append('document_id', docId);
          textForm.append('file_url', fileUrl);
          textForm.append('file_ext', fileExt);
          const extractResult = await api('/extract', { method: 'POST', body: textForm });
          rawText = extractResult.full_text || '';
          sections = extractResult.sections || [{ title: 'Document', content: rawText }];
          pageCount = extractResult.page_count || 1;
        } catch {
          rawText = `[Content extracted from ${file.name}]\nThis document has been uploaded for AI analysis.`;
          sections = [{ title: 'Introduction', content: rawText }];
        }
      }

      setProgress({ stage: 'Creating document record...', percent: 50 });

      const docData = {
        id: docId,
        filename: file.name,
        file_url: fileUrl,
        status: 'analyzing',
        raw_text: rawText,
        file_type: fileExt,
        file_size: file.size,
        page_count: pageCount,
        sections,
        metadata: { uploaded_at: new Date().toISOString() },
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'documents', docId), docData);
      setCurrentDoc(docData);
      setDocuments(prev => [docData, ...prev.filter(d => d.id !== docId)].slice(0, 10));

      setProgress({ stage: 'Running AI analysis...', percent: 70 });

      const analyzeForm = new FormData();
      analyzeForm.append('document_id', docId);
      analyzeForm.append('filename', file.name);
      analyzeForm.append('raw_text', rawText.slice(0, 30000));
      analyzeForm.append('settings', JSON.stringify(currentSettings));
      const analysisResult = await api('/analyze', { method: 'POST', body: analyzeForm });

      setProgress({ stage: 'Storing results...', percent: 90 });

      const analysisData = {
        document_id: docId,
        ...analysisResult.analysis,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'analyses', docId), analysisData);
      await setDoc(doc(db, 'documents', docId), { ...docData, status: 'ready' }, { merge: true });
      setAnalysis(analysisData);

      setProgress({ stage: 'Analysis complete!', percent: 100 });
      setActiveTab(1);
    } catch (err) {
      console.error('Upload error:', err);
      setProgress({ stage: 'Error occurred', percent: 0 });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress({ stage: '', percent: 0 });
      }, 500);
    }
  }, [api]);

  const chatWithDoc = useCallback(async (question) => {
    if (!currentDoc) return null;
    const formData = new FormData();
    formData.append('document_id', currentDoc.id);
    formData.append('raw_text', (currentDoc.raw_text || '').slice(0, 25000));
    formData.append('filename', currentDoc.filename || 'document');
    formData.append('findings', JSON.stringify(analysis?.key_findings || []));
    formData.append('keywords', JSON.stringify(analysis?.keywords || []));
    formData.append('question', question);
    return api('/chat', { method: 'POST', body: formData });
  }, [api, currentDoc, analysis]);

  const compareDocuments = useCallback(async (doc2Id) => {
    if (!currentDoc || !doc2Id) return null;
    const formData = new FormData();
    formData.append('doc1_id', currentDoc.id);
    formData.append('doc1_text', (currentDoc.raw_text || '').slice(0, 15000));
    formData.append('doc1_name', currentDoc.filename || 'Document 1');
    formData.append('doc2_id', doc2Id);

    const doc2 = documents.find(d => d.id === doc2Id);
    formData.append('doc2_text', (doc2?.raw_text || '').slice(0, 15000));
    formData.append('doc2_name', doc2?.filename || 'Document 2');

    const result = await api('/compare', { method: 'POST', body: formData });
    setCompareResult(result);
    return result;
  }, [api, currentDoc, documents]);

  const loadDocument = useCallback(async (docId) => {
    try {
      const docSnap = await getDoc(doc(db, 'documents', docId));
      if (docSnap.exists()) {
        const docData = { id: docSnap.id, ...docSnap.data() };
        setCurrentDoc(docData);
        const analysisSnap = await getDoc(doc(db, 'analyses', docId));
        setAnalysis(analysisSnap.exists() ? analysisSnap.data() : null);
      }
    } catch (e) {
      console.error('Error loading document:', e);
    }
  }, []);

  const deleteDocument = useCallback(async (docId) => {
    try {
      await deleteDoc(doc(db, 'documents', docId));
      await deleteDoc(doc(db, 'analyses', docId));
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (currentDoc?.id === docId) {
        setCurrentDoc(null);
        setAnalysis(null);
      }
    } catch (e) {
      console.error('Error deleting document:', e);
    }
  }, [currentDoc]);

  const value = {
    documents, setDocuments,
    currentDoc, setCurrentDoc,
    analysis, setAnalysis,
    activeTab, setActiveTab,
    loading, setLoading,
    progress, setProgress,
    compareResult, setCompareResult,
    uploadAndAnalyze,
    chatWithDoc,
    compareDocuments,
    loadDocument,
    deleteDocument,
    api
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}
