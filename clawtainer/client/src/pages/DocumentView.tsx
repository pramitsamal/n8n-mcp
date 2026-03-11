import React, { useState, useEffect } from 'react';
import { getDocument, analyzeDocument, DocData } from '../api';

export function DocumentView({ docId }: { docId: string }) {
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    getDocument(docId).then(d => {
      setDoc(d);
      if (d.ai_analysis) {
        try { setAnalysis(JSON.parse(d.ai_analysis)); } catch { /* ignore */ }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [docId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await analyzeDocument(docId);
      setAnalysis(res.analysis);
      // Refresh doc
      const updated = await getDocument(docId);
      setDoc(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Analysis failed');
    }
    setAnalyzing(false);
  };

  if (loading || !doc) {
    return <div className="page text-center mt-16"><div className="spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card-title">{doc.filename}</div>
        <div className="card-meta">
          <span>{doc.doc_type}</span>
          <span>{doc.file_size ? `${(doc.file_size / 1024).toFixed(0)}KB` : ''}</span>
          <span>{new Date(doc.uploaded_at).toLocaleDateString('en-IN')}</span>
        </div>
      </div>

      {/* OCR Text */}
      {doc.ocr_text && (
        <div className="card">
          <h3 style={{ fontSize: 14, marginBottom: 8, color: 'var(--text-secondary)' }}>Extracted Text</h3>
          <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', background: 'var(--bg-input)', padding: 12, borderRadius: 8 }}>
            {doc.ocr_text}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {analysis ? (
        <div className="card">
          <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--primary)' }}>AI Analysis</h3>

          {analysis.summary && (
            <div className="analysis-section">
              <h4>Summary</h4>
              <p style={{ fontSize: 14 }}>{String(analysis.summary)}</p>
            </div>
          )}

          {analysis.case_nature && (
            <div className="analysis-section">
              <h4>Case Nature</h4>
              <p style={{ fontSize: 14 }}>{String(analysis.case_nature)}</p>
            </div>
          )}

          {Array.isArray(analysis.relevant_sections) && analysis.relevant_sections.length > 0 && (
            <div className="analysis-section">
              <h4>Relevant Legal Sections</h4>
              <ul>{(analysis.relevant_sections as string[]).map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}

          {Array.isArray(analysis.key_facts) && analysis.key_facts.length > 0 && (
            <div className="analysis-section">
              <h4>Key Facts</h4>
              <ul>{(analysis.key_facts as string[]).map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}

          {Array.isArray(analysis.strengths) && analysis.strengths.length > 0 && (
            <div className="analysis-section">
              <h4>Strengths</h4>
              <ul>{(analysis.strengths as string[]).map((s, i) => <li key={i} style={{ color: 'var(--success)' }}>{s}</li>)}</ul>
            </div>
          )}

          {Array.isArray(analysis.weaknesses) && analysis.weaknesses.length > 0 && (
            <div className="analysis-section">
              <h4>Weaknesses</h4>
              <ul>{(analysis.weaknesses as string[]).map((s, i) => <li key={i} style={{ color: 'var(--danger)' }}>{s}</li>)}</ul>
            </div>
          )}

          {analysis.suggested_strategy && (
            <div className="analysis-section">
              <h4>Suggested Strategy</h4>
              <p style={{ fontSize: 14 }}>{String(analysis.suggested_strategy)}</p>
            </div>
          )}

          {Array.isArray(analysis.relevant_precedents) && analysis.relevant_precedents.length > 0 && (
            <div className="analysis-section">
              <h4>Relevant Precedents</h4>
              <ul>{(analysis.relevant_precedents as string[]).map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}

          {analysis.estimated_duration && (
            <div className="analysis-section">
              <h4>Estimated Duration</h4>
              <p style={{ fontSize: 14 }}>{String(analysis.estimated_duration)}</p>
            </div>
          )}
        </div>
      ) : doc.ocr_text ? (
        <button className="btn btn-accent btn-block" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? <><span className="spinner" /> Analyzing...</> : 'Analyze with AI'}
        </button>
      ) : (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No text extracted from this document.</p>
          <p style={{ fontSize: 13 }}>Upload an image to enable OCR and AI analysis.</p>
        </div>
      )}
    </div>
  );
}
