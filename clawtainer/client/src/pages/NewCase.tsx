import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCase } from '../api';

export function NewCase() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    case_number: '',
    court: '',
    case_type: 'divorce',
    petitioner: '',
    respondent: '',
    lawyer_role: 'petitioner',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Case title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const c = await createCase(form);
      navigate(`/case/${c.id}`, { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create case');
      setLoading(false);
    }
  };

  return (
    <div className="page">
      {error && <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>{error}</div>}

      <div className="form-group">
        <label>Case Title *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g., Sharma vs Sharma - Divorce" autoFocus />
      </div>

      <div className="form-group">
        <label>Case Number</label>
        <input value={form.case_number} onChange={e => set('case_number', e.target.value)} placeholder="e.g., HMA/2024/1234" />
      </div>

      <div className="form-group">
        <label>Court</label>
        <input value={form.court} onChange={e => set('court', e.target.value)} placeholder="e.g., Family Court, Saket, New Delhi" />
      </div>

      <div className="form-group">
        <label>Case Type</label>
        <select value={form.case_type} onChange={e => set('case_type', e.target.value)}>
          <option value="divorce">Divorce</option>
          <option value="custody">Custody</option>
          <option value="maintenance">Maintenance</option>
          <option value="domestic_violence">Domestic Violence</option>
          <option value="guardianship">Guardianship</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Petitioner</label>
        <input value={form.petitioner} onChange={e => set('petitioner', e.target.value)} placeholder="Name of petitioner" />
      </div>

      <div className="form-group">
        <label>Respondent</label>
        <input value={form.respondent} onChange={e => set('respondent', e.target.value)} placeholder="Name of respondent" />
      </div>

      <div className="form-group">
        <label>Your Role</label>
        <select value={form.lawyer_role} onChange={e => set('lawyer_role', e.target.value)}>
          <option value="petitioner">Petitioner&apos;s Counsel</option>
          <option value="respondent">Respondent&apos;s Counsel</option>
        </select>
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Initial notes about the case..." rows={3} />
      </div>

      <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
        {loading ? <span className="spinner" /> : 'Create Case'}
      </button>
    </div>
  );
}
