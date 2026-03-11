import React, { useState, useEffect } from 'react';
import { authStatus, authSetup, authLogin, setToken, hasToken, clearToken } from './api';

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  userName: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ loading: true, authenticated: false, userName: null });

  useEffect(() => {
    if (hasToken()) {
      setState({ loading: false, authenticated: true, userName: null });
    } else {
      setState({ loading: false, authenticated: false, userName: null });
    }
  }, []);

  const login = (token: string, name: string) => {
    setToken(token);
    setState({ loading: false, authenticated: true, userName: name });
  };

  const logout = () => {
    clearToken();
    setState({ loading: false, authenticated: false, userName: null });
  };

  return { ...state, login, logout };
}

export function PinScreen({ onAuth }: { onAuth: (token: string, name: string) => void }) {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authStatus().then(s => setSetupRequired(s.setupRequired)).catch(() => setSetupRequired(true));
  }, []);

  const handleKey = async (digit: string) => {
    if (digit === 'del') {
      setPin(p => p.slice(0, -1));
      setError('');
      return;
    }
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 6) {
      setLoading(true);
      setError('');
      try {
        if (setupRequired) {
          if (!name.trim()) {
            setError('Please enter your name first');
            setPin('');
            setLoading(false);
            return;
          }
          const res = await authSetup(name.trim(), newPin);
          onAuth(res.token, res.user.name);
        } else {
          const res = await authLogin(newPin);
          onAuth(res.token, res.user.name);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setPin('');
      }
      setLoading(false);
    }
  };

  if (setupRequired === null) {
    return <div className="pin-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="pin-screen">
      <h1>Clawtainer</h1>
      <p>{setupRequired ? 'Set up your account' : 'Enter your PIN'}</p>

      {setupRequired && (
        <div className="setup-form">
          <input
            type="text"
            placeholder="Your name (e.g., Adv. Sharma)"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <div className="pin-dots">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
        ))}
      </div>

      <div className="pin-pad">
        {['1','2','3','4','5','6','7','8','9','','0','del'].map(k => (
          <button
            key={k}
            className={`pin-key ${!k ? 'empty' : ''}`}
            onClick={() => k && handleKey(k)}
            disabled={loading || (!k)}
          >
            {k === 'del' ? '\u232B' : k}
          </button>
        ))}
      </div>

      {error && <div className="pin-error">{error}</div>}
      {loading && <div style={{ marginTop: 16 }}><div className="spinner" /></div>}
      {setupRequired && <p style={{ marginTop: 24, fontSize: 13, opacity: 0.6 }}>Choose a 6-digit PIN</p>}
    </div>
  );
}
