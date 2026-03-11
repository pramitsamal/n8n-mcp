import React, { useState, useEffect, useRef } from 'react';
import { getChat, sendChat, MessageData } from '../api';

export function Chat({ caseId }: { caseId: string }) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChat(caseId).then(m => {
      setMessages(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [caseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || sending) return;

    setInput('');
    setSending(true);

    // Optimistically add user message
    const tempMsg: MessageData = {
      id: 'temp-' + Date.now(),
      case_id: caseId,
      role: 'user',
      content: msg,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { reply } = await sendChat(caseId, msg);
      // Replace temp with actual messages
      const updated = await getChat(caseId);
      setMessages(updated);
    } catch (e) {
      const errMsg: MessageData = {
        id: 'err-' + Date.now(),
        case_id: caseId,
        role: 'assistant',
        content: `Error: ${e instanceof Error ? e.message : 'Failed to get response'}`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    }
    setSending(false);
  };

  const SUGGESTIONS = [
    'What are the strongest precedents for this case?',
    'Draft a prayer clause for interim maintenance',
    'What sections of law apply here?',
    'Summarize all documents on file',
    'What is the typical duration for this type of case?',
  ];

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {loading ? (
          <div className="text-center mt-16"><div className="spinner" /></div>
        ) : messages.length === 0 ? (
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
              Ask your AI research assistant anything about this case
            </div>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                  margin: '0 0 8px', background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 10, fontSize: 14, color: 'var(--text)', cursor: 'pointer'
                }}
                onClick={() => { setInput(s); }}
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`chat-bubble ${m.role}`}>
              {m.content}
            </div>
          ))
        )}
        {sending && (
          <div className="chat-bubble assistant">
            <div className="spinner" style={{ width: 18, height: 18 }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a legal question..."
          disabled={sending}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={sending || !input.trim()}>
          {'\u{27A4}'}
        </button>
      </div>
    </div>
  );
}
