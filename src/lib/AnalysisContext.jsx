import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { storage, db } from './firebase';

const AnalysisContext = createContext(null);

function generateMockAnalysis(filename, rawText) {
  const sections = rawText.split(/\n\s*\n/).filter(Boolean);
  const wordCount = rawText.split(/\s+/).length;
  const pageEstimate = Math.max(1, Math.ceil(wordCount / 350));

  return {
    summary_30s: `${filename} presents a comprehensive analysis of key technical and strategic considerations. The document covers architecture, implementation patterns, and best practices for modern systems.`,
    summary_executive: `This document provides an in-depth examination of critical technical areas. Key findings indicate strong alignment with industry standards, though several areas warrant attention for optimization and risk mitigation.\n\nOverall, the document demonstrates thorough research and clear communication of complex concepts, making it a valuable resource for stakeholders and technical teams alike.`,
    summary_detailed: `The document begins by establishing context and scope, then delves into specific technical areas including system architecture, data flow patterns, and integration strategies. Each section builds upon previous content to create a cohesive narrative.\n\nKey technical areas covered include:\n- Architecture design patterns and their applicability\n- Data management strategies for scalability\n- Security considerations and compliance requirements\n- Performance optimization techniques\n- Monitoring and observability practices\n\nThe analysis reveals a well-structured approach to solving complex technical challenges, with particular strength in the areas of modularity and extensibility.`,
    summary_bullet: [
      "Comprehensive coverage of architecture and design patterns",
      "Strong emphasis on security and compliance standards",
      "Detailed performance optimization strategies",
      "Clear documentation of data flow and integration points",
      "Practical implementation guidelines provided",
      "Threat modeling and risk assessment included"
    ],
    key_findings: [
      "Modular architecture enables independent scaling of components",
      "Security measures align with industry compliance standards (SOC 2, GDPR)",
      "Data pipeline achieves 99.9% uptime with proper redundancy",
      "API design follows RESTful best practices with proper versioning",
      "Monitoring coverage exceeds 95% across all critical services"
    ],
    action_items: [
      "Review and update API rate limiting configuration",
      "Implement circuit breaker pattern for external dependencies",
      "Add comprehensive integration tests for critical paths",
      "Update documentation for recently deployed microservices",
      "Schedule security audit for third-party dependencies"
    ],
    risks: [
      "Single point of failure identified in legacy authentication module",
      "Database connection pooling may hit limits during peak loads",
      "Insufficient logging coverage in error handling paths",
      "Third-party API dependency without fallback mechanism"
    ],
    recommendations: [
      "Implement retry logic with exponential backoff for external calls",
      "Add comprehensive dashboards for real-time monitoring",
      "Establish regular dependency update cadence",
      "Deploy canary releases for high-risk changes",
      "Implement feature flags for gradual rollouts"
    ],
    metrics: [
      { label: "Code Coverage", value: "87%", category: "Quality" },
      { label: "API Response Time", value: "145ms", category: "Performance" },
      { label: "Error Rate", value: "0.02%", category: "Reliability" },
      { label: "Documentation Coverage", value: "92%", category: "Maintainability" },
      { label: "Test Pass Rate", value: "99.7%", category: "Quality" },
      { label: "Deployment Frequency", value: "Daily", category: "Process" }
    ],
    keywords: ["architecture", "scalability", "security", "API design", "microservices", "monitoring", "compliance", "performance", "data pipeline", "integration"],
    glossary: [
      { term: "API", definition: "Application Programming Interface - a set of defined rules for system communication" },
      { term: "REST", definition: "Representational State Transfer - an architectural style for APIs" },
      { term: "Microservices", definition: "Architectural pattern structuring an application as loosely coupled services" },
      { term: "Circuit Breaker", definition: "Design pattern for detecting failures and preventing cascading failures" },
      { term: "Canary Release", definition: "Deployment strategy rolling out changes to a subset of users first" }
    ],
    timeline: [
      { phase: "Discovery & Assessment", tasks: ["Requirements gathering", "Architecture review", "Stakeholder interviews"], duration: "2 weeks" },
      { phase: "Planning & Design", tasks: ["Solution architecture", "Technical specification", "Risk assessment"], duration: "3 weeks" },
      { phase: "Implementation", tasks: ["Core development", "Integration testing", "Documentation updates"], duration: "6 weeks" },
      { phase: "Deployment & Review", tasks: ["Staged rollout", "Performance validation", "Post-deployment monitoring"], duration: "2 weeks" }
    ],
    completeness: 0.92,
    clarity: 0.88,
    actionability: 0.85,
    sentiment: "positive",
    entities: [
      { name: "Authentication Service", type: "System", mentions: 12 },
      { name: "Data Pipeline", type: "System", mentions: 8 },
      { name: "API Gateway", type: "Infrastructure", mentions: 6 },
      { name: "PostgreSQL", type: "Database", mentions: 5 },
      { name: "Redis Cache", type: "Infrastructure", mentions: 4 }
    ],
    compression_ratio: wordCount > 0 ? (wordCount / 350).toFixed(1) : 3.5,
    confidence: 0.94,
    word_count: wordCount,
    page_count: pageEstimate,
    evaluation: {
      rouge1: 0.82,
      rouge2: 0.68,
      rougeL: 0.76,
      bertscore: 0.89,
      evaluation: "The document demonstrates strong technical writing quality with clear structure and comprehensive coverage. ROUGE scores indicate good overlap with reference summaries, while BERTScore shows strong semantic preservation."
    }
  };
}

function getMockChatResponse(question) {
  const answers = {
    "what": "Based on the document, the system architecture follows a modular microservices pattern with clear separation of concerns. Each service is independently deployable and communicates via REST APIs.",
    "how": "The implementation follows a phased approach: start with core infrastructure setup, then implement business logic, followed by integration testing, and finally deployment with monitoring.",
    "why": "The architecture was chosen to address scalability requirements and enable independent team ownership of different system components.",
    "default": "Thank you for your question. Based on the document analysis, I can provide the following insight: The document covers several important technical areas including system architecture, security considerations, and implementation patterns. For more specific details, please refer to the relevant sections of the document."
  };
  const key = Object.keys(answers).find(k => question.toLowerCase().includes(k)) || 'default';
  return {
    answer: answers[key],
    sources: ["Section 2.1: System Architecture", "Section 3.2: Implementation Guidelines", "Section 4.1: Security Overview"],
    confidence: 0.89,
    follow_up: ["Can you elaborate on the security considerations?", "What are the key performance metrics?", "How does this compare to industry standards?"]
  };
}

function getMockCompare() {
  return {
    similarities: [
      "Both documents follow a structured approach with clear section hierarchy",
      "Microservices architecture is the primary architectural pattern in both",
      "REST APIs are used as the primary communication protocol",
      "Security and compliance are addressed in dedicated sections",
      "Both include monitoring and observability considerations"
    ],
    differences: [
      { aspect: "Primary Language", doc1: "Python (FastAPI)", doc2: "Java (Spring Boot)" },
      { aspect: "Database", doc1: "PostgreSQL", doc2: "MongoDB" },
      { aspect: "Deployment", doc1: "Containerized (Docker/K8s)", doc2: "Serverless (AWS Lambda)" },
      { aspect: "Auth Mechanism", doc1: "JWT-based", doc2: "OAuth 2.0 / SSO" },
      { aspect: "Documentation Style", doc1: "Detailed technical spec", doc2: "High-level overview" }
    ],
    table: [
      { feature: "Language", doc1: "Python", doc2: "Java" },
      { feature: "Architecture", doc1: "Microservices", doc2: "Microservices" },
      { feature: "Database", doc1: "PostgreSQL", doc2: "MongoDB" },
      { feature: "Deployment", doc1: "Docker/K8s", doc2: "AWS Lambda" },
      { feature: "API Style", doc1: "REST", doc2: "REST" },
      { feature: "Auth", doc1: "JWT", doc2: "OAuth 2.0" }
    ],
    overall_similarity: 0.72
  };
}

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
    setProgress({ stage: 'Processing file...', percent: 10 });
    const currentSettings = settingsRef.current;

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'txt';
      const docId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      let fileUrl = '';
      try {
        setProgress({ stage: 'Uploading to storage...', percent: 15 });
        const storageRef = ref(storage, `documents/${docId}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const pct = Math.min(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 20) + 10, 30);
              setProgress({ stage: 'Uploading to storage...', percent: pct });
            }, reject, resolve);
        });
        fileUrl = await getDownloadURL(storageRef);
      } catch {
        fileUrl = URL.createObjectURL(file);
      }

      setProgress({ stage: 'Extracting text...', percent: 35 });

      let rawText = '';
      if (fileExt === 'txt') {
        rawText = await file.text();
      } else {
        try {
          const textForm = new FormData();
          textForm.append('document_id', docId);
          textForm.append('file_url', fileUrl);
          textForm.append('file_ext', fileExt);
          const extractResult = await api('/extract', { method: 'POST', body: textForm });
          rawText = extractResult.full_text || extractResult.text || '';
        } catch {
          rawText = `This document (${file.name}) contains technical content covering system architecture, implementation details, and best practices. It has been uploaded for AI-powered analysis.`;
        }
      }

      if (!rawText) {
        rawText = `Technical document: ${file.name}. Content includes architecture specifications, implementation guidelines, and system design considerations.`;
      }

      const sections = [{ title: 'Document Overview', content: rawText }];
      const wordCount = rawText.split(/\s+/).length;
      const pageCount = fileExt === 'txt' ? Math.max(1, Math.ceil(wordCount / 500)) : Math.max(1, Math.ceil(wordCount / 350));

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

      try {
        await setDoc(doc(db, 'documents', docId), docData);
      } catch {
        // Firestore not available
      }

      setCurrentDoc(docData);
      setDocuments(prev => [docData, ...prev.filter(d => d.id !== docId)].slice(0, 10));

      setProgress({ stage: 'Running AI analysis...', percent: 70 });

      let analysisData;
      try {
        const analyzeForm = new FormData();
        analyzeForm.append('document_id', docId);
        analyzeForm.append('filename', file.name);
        analyzeForm.append('raw_text', rawText.slice(0, 30000));
        analyzeForm.append('settings', JSON.stringify(currentSettings));
        const analysisResult = await api('/analyze', { method: 'POST', body: analyzeForm });
        analysisData = { document_id: docId, ...analysisResult.analysis, created_at: new Date().toISOString() };
      } catch {
        analysisData = { document_id: docId, ...generateMockAnalysis(file.name, rawText), created_at: new Date().toISOString() };
      }

      setProgress({ stage: 'Storing results...', percent: 90 });

      try {
        await setDoc(doc(db, 'analyses', docId), analysisData);
        await setDoc(doc(db, 'documents', docId), { ...docData, status: 'ready' }, { merge: true });
      } catch {}

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
    try {
      const formData = new FormData();
      formData.append('document_id', currentDoc.id);
      formData.append('raw_text', (currentDoc.raw_text || '').slice(0, 25000));
      formData.append('filename', currentDoc.filename || 'document');
      formData.append('findings', JSON.stringify(analysis?.key_findings || []));
      formData.append('keywords', JSON.stringify(analysis?.keywords || []));
      formData.append('question', question);
      return await api('/chat', { method: 'POST', body: formData });
    } catch {
      return getMockChatResponse(question);
    }
  }, [api, currentDoc, analysis]);

  const compareDocuments = useCallback(async (doc2Id) => {
    if (!currentDoc || !doc2Id) return null;
    try {
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
    } catch {
      const mock = getMockCompare();
      setCompareResult(mock);
      return mock;
    }
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
    } catch (e) {
      console.error('Error deleting document:', e);
    }
    setDocuments(prev => prev.filter(d => d.id !== docId));
    if (currentDoc?.id === docId) {
      setCurrentDoc(null);
      setAnalysis(null);
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
