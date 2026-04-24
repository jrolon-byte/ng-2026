import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import Loader from './Loader';

export default function UpgradePrompt() {
  const { token } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: 'starter' | 'pro' | 'enterprise') => {
    setLoading(plan);
    try {
      const res = await fetch(`${BASE_URL}/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'upgrade', plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      window.location.href = data.url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        background: '#f2fbff',
        borderRadius: 12,
        padding: 30,
        textAlign: 'center',
        maxWidth: 480,
        margin: '20px auto',
      }}
    >
      <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 24 }}>
        Your customers got your message! Keep reaching them every week.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {loading === 'starter' ? (
          <Loader />
        ) : (
          <button
            onClick={() => handleUpgrade('starter')}
            className="btn"
            style={{ color: 'white', background: 'black' }}
            disabled={loading !== null}
          >
            Starter &mdash; $29/mo · 600 texts
          </button>
        )}
        {loading === 'pro' ? (
          <Loader />
        ) : (
          <button
            onClick={() => handleUpgrade('pro')}
            className="btn"
            style={{ color: 'white', background: 'black' }}
            disabled={loading !== null}
          >
            Pro &mdash; $49/mo · 1,500 texts
          </button>
        )}
        {loading === 'enterprise' ? (
          <Loader />
        ) : (
          <button
            onClick={() => handleUpgrade('enterprise')}
            className="btn"
            style={{ color: 'white', background: 'black' }}
            disabled={loading !== null}
          >
            Enterprise &mdash; $149/mo · 4,000 texts
          </button>
        )}
      </div>
    </div>
  );
}
