import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCase, getDocuments, getTimeline, uploadDocument, analyzeDocument, extractDocumentText, createTimelineEvent, CaseData, DocData, TimelineEventData, updateDocument } from '../api';

const DOC_TYPES = [
  { value: 'petition', label: 'Petition' },
  { value: 'application', label: 'Application' },
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'fir', label: 'FIR' },
  { value: 'court_notice', label: 'Court Notice' },
  { value: 'order', label: 'Order' },
  { value: 'counter', label: 'Counter/Objection' },
  { value: 'reply', label: 'Reply/Rejoinder' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'other', label: 'Other' },
];

const EVENT_TYPES = [
  { value: 'filing', label: 'Filing' },
  { value: 'hearing', label: 'Hearing' },
  { value: 'order', label: 'Order' },
  { value: 'submission', label: 'Submission' },
  { value: 'notice', label: 'Notice' },
  { value: 'other', label: 'Other' },
];

export function CaseDetail({ id }: { id: string }) {
  const [tab, setTab] = useState<'overview' | 'docs' | 'timeline'>('overview');
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [docs, setDocs] = useState<DocData[]>([]);
  const [timeline, setTimeline] = useState<TimelineEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [c, d, t] = await Promise.all([getCase(id), getDocuments(id), getTimeline(id)]);
      setCaseData(c);
      setDocs(d);
      setTimeline(t);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading || !caseData) {
    return <div className="page text-center mt-16"><div className="spinner" /></div>;
  }

  return (
    <div className="page">
      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`tab ${tab === 'docs' ? 'active' : ''}`} onClick={() => setTab('docs')}>Documents</button>
        <button className={`tab ${tab === 'timeline' ? 'active' : ''}`} onClick={() => setTab('timeline')}>Timeline</button>
      </div>

      {tab === 'overview' && <OverviewTab caseData={caseData} onChat={() => navigate(`/case/${id}/chat`)} />}
      {tab === 'docs' && <DocumentsTab caseId={id} docs={docs} onRefresh={load} />}
      {tab === 'timeline' && <TimelineTab caseId={id} events={timeline} onRefresh={load} />}
    </div>
  );
}

function OverviewTab({ caseData, onChat }: { caseData: CaseData; onChat: () => void }) {
  const fields = [
    { label: 'Case Number', value: caseData.case_number },
    { label: 'Court', value: caseData.court },
    { label: 'Type', value: caseData.case_type },
    { label: 'Status', value: caseData.status },
    { label: 'Petitioner', value: caseData.petitioner },
    { label: 'Respondent', value: caseData.respondent },
    { label: 'Your Role', value: caseData.lawyer_role === 'petitioner' ? "Petitioner's Counsel" : "Respondent's Counsel" },
    { label: 'Created', value: new Date(caseData.created_at).toLocaleDateString('en-IN') },
  ];

  return (
    <>
      <div className="card">
        {fields.map(f => f.value && (
          <div key={f.label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{f.label}</div>
            <div style={{ fontSize: 15 }}>{f.value}</div>
          </div>
        ))}
        {caseData.notes && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Notes</div>
            <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{caseData.notes}</div>
          </div>
        )}
      </div>

      <div className="card-meta" style={{ justifyContent: 'center', marginBottom: 16 }}>
        <span>{caseData.stats?.documents || 0} documents</span>
        <span>{caseData.stats?.events || 0} events</span>
        <span>{caseData.stats?.messages || 0} messages</span>
      </div>

      <button className="btn btn-accent btn-block" onClick={onChat}>
        AI Research Assistant
      </button>
    </>
  );
}

function DocumentsTab({ caseId, docs, onRefresh }: { caseId: string; docs: DocData[]; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState('other');
  const [ocrProgress, setOcrProgress] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleUpload = async (file: File) => {
    setUploading(true);
    setOcrProgress('Processing...');

    let ocrText = '';

    // Try OCR for images
    if (file.type.startsWith('image/')) {
      try {
        setOcrProgress('Running OCR...');
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng+hin');
        const { data } = await worker.recognize(file);
        ocrText = data.text;
        await worker.terminate();
        setOcrProgress('OCR complete');
      } catch (e) {
        console.error('OCR failed:', e);
        setOcrProgress('OCR failed, uploading without text');
      }
    }

    try {
      await uploadDocument(caseId, file, docType, ocrText || undefined);
      setShowUpload(false);
      onRefresh();
    } catch (e) {
      console.error('Upload failed:', e);
    }
    setUploading(false);
    setOcrProgress('');
  };

  const handleExtract = async (docId: string) => {
    setExtracting(docId);
    try {
      await extractDocumentText(docId);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Text extraction failed');
    }
    setExtracting(null);
  };

  const handleAnalyze = async (docId: string) => {
    setAnalyzing(docId);
    try {
      await analyzeDocument(docId);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Analysis failed');
    }
    setAnalyzing(null);
  };

  return (
    <>
      {showUpload ? (
        <div className="card">
          <div className="form-group">
            <label>Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="upload-area" onClick={() => fileRef.current?.click()}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              capture="environment"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            {uploading ? (
              <div>
                <div className="spinner" />
                <p style={{ marginTop: 8, fontSize: 14 }}>{ocrProgress}</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{'\u{1F4F7}'}</div>
                <p>Tap to take photo or select file</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Supports images, PDF, DOC, TXT</p>
              </div>
            )}
          </div>

          <button className="btn btn-outline btn-block mt-8" onClick={() => setShowUpload(false)}>Cancel</button>
        </div>
      ) : (
        <>
          {docs.length === 0 ? (
            <div className="empty-state">
              <div className="icon">{'\u{1F4C4}'}</div>
              <h3>No documents</h3>
              <p>Upload petitions, affidavits, orders, and more</p>
            </div>
          ) : (
            docs.map(doc => (
              <div key={doc.id} className="doc-item">
                <div className="doc-icon" onClick={() => navigate(`/document/${doc.id}`)} style={{ cursor: 'pointer' }}>
                  {doc.mime_type?.startsWith('image/') ? '\u{1F5BC}' : '\u{1F4C4}'}
                </div>
                <div className="doc-info" onClick={() => navigate(`/document/${doc.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="doc-name">{doc.filename}</div>
                  <div className="doc-meta">
                    {doc.doc_type} &middot; {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)}KB` : ''} &middot; {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}
                  </div>
                  {doc.ai_summary && <div className="doc-meta" style={{ color: 'var(--success)' }}>AI analyzed</div>}
                </div>
                {!doc.ocr_text && !doc.mime_type?.startsWith('image/') && (
                  <button
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: 12, minHeight: 'auto' }}
                    onClick={() => handleExtract(doc.id)}
                    disabled={extracting === doc.id}
                  >
                    {extracting === doc.id ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Extract Text'}
                  </button>
                )}
                {!doc.ai_analysis && doc.ocr_text && (
                  <button
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: 12, minHeight: 'auto' }}
                    onClick={() => handleAnalyze(doc.id)}
                    disabled={analyzing === doc.id}
                  >
                    {analyzing === doc.id ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Analyze'}
                  </button>
                )}
              </div>
            ))
          )}

          <button className="fab" onClick={() => setShowUpload(true)}>+</button>
        </>
      )}
    </>
  );
}

function TimelineTab({ caseId, events, onRefresh }: { caseId: string; events: TimelineEventData[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', event_date: new Date().toISOString().split('T')[0], event_type: 'hearing', description: '' });

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    try {
      await createTimelineEvent(caseId, form);
      setShowForm(false);
      setForm({ title: '', event_date: new Date().toISOString().split('T')[0], event_type: 'hearing', description: '' });
      onRefresh();
    } catch (e) { console.error(e); }
  };

  return (
    <>
      {showForm && (
        <div className="card mb-16">
          <div className="form-group">
            <label>Event Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Next hearing date" />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="flex gap-8">
            <button className="btn btn-primary flex-1" onClick={handleAdd}>Add Event</button>
            <button className="btn btn-outline flex-1" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="icon">{'\u{1F4C5}'}</div>
          <h3>No timeline events</h3>
          <p>Events are added automatically when you upload documents, or add them manually</p>
        </div>
      ) : (
        <div className="timeline">
          {events.map(ev => (
            <div key={ev.id} className={`timeline-item ${ev.event_type || ''}`}>
              <div className="timeline-date">{new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div className="timeline-title">{ev.title}</div>
              {ev.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{ev.description}</div>}
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>{ev.event_type}</div>
            </div>
          ))}
        </div>
      )}

      {!showForm && <button className="fab" onClick={() => setShowForm(true)}>+</button>}
    </>
  );
}
