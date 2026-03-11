import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases, CaseData } from '../api';

const STATUS_BADGES: Record<string, string> = {
  active: 'badge-active',
  closed: 'badge-closed',
  appeal: 'badge-appeal',
};

const TYPE_LABELS: Record<string, string> = {
  divorce: 'Divorce',
  custody: 'Custody',
  maintenance: 'Maintenance',
  domestic_violence: 'Domestic Violence',
  guardianship: 'Guardianship',
  other: 'Other',
};

export function CaseList({ showSearch = false }: { showSearch?: boolean }) {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async (q?: string) => {
    setLoading(true);
    try {
      const data = await getCases(q);
      setCases(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => {
    if (search.trim()) load(search.trim());
    else load();
  };

  return (
    <div className="page">
      {showSearch && (
        <div className="flex gap-8 mb-16">
          <input
            className="flex-1"
            style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 16, background: 'var(--bg-input)' }}
            placeholder="Search cases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>Go</button>
        </div>
      )}

      {loading ? (
        <div className="text-center mt-16"><div className="spinner" /></div>
      ) : cases.length === 0 ? (
        <div className="empty-state">
          <div className="icon">{'\u{1F4C1}'}</div>
          <h3>No cases yet</h3>
          <p>Tap + to create your first case</p>
        </div>
      ) : (
        cases.map(c => (
          <div key={c.id} className="card" onClick={() => navigate(`/case/${c.id}`)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="card-title">{c.title}</div>
              <span className={`badge ${STATUS_BADGES[c.status] || ''}`}>{c.status}</span>
            </div>
            {c.case_type && <div className="card-subtitle">{TYPE_LABELS[c.case_type] || c.case_type}</div>}
            {c.case_number && <div className="card-subtitle">Case No: {c.case_number}</div>}
            {c.court && <div className="card-subtitle">{c.court}</div>}
            <div className="card-meta">
              {c.stats && (
                <>
                  <span>{c.stats.documents} docs</span>
                  <span>{c.stats.events} events</span>
                  <span>{c.stats.messages} msgs</span>
                </>
              )}
            </div>
          </div>
        ))
      )}

      {!showSearch && (
        <button className="fab" onClick={() => navigate('/new-case')}>+</button>
      )}
    </div>
  );
}
