import { useEffect, useState } from 'react';
import { getOrgs, type Org } from '../services/orgs';
import { listActiveGifts, setOrgBonus, type ActiveGift } from '../services/admin';

// Default expiry: midnight UTC on the first of next month — matches the
// monthly SMS reset so the gift naturally disappears when the cycle flips.
function defaultExpiresAt(): string {
  const now = new Date();
  const firstOfNext = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return firstOfNext.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm for <input type="datetime-local">
}

export default function AdminGiftManager() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeGifts, setActiveGifts] = useState<ActiveGift[]>([]);
  const [loading, setLoading] = useState(true);

  const [orgId, setOrgId] = useState('');
  const [extraTexts, setExtraTexts] = useState(274);
  const [expiresAt, setExpiresAt] = useState(defaultExpiresAt());
  const [note, setNote] = useState('A little extra this month — on us. Just because.');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successFor, setSuccessFor] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [o, g] = await Promise.all([getOrgs(), listActiveGifts()]);
      setOrgs(o);
      setActiveGifts(g);
      if (!orgId && o.length > 0) setOrgId(o[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const onGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || extraTexts <= 0 || !expiresAt) {
      setError('Pick an org, a number, and an expiry.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setOrgBonus({
        org_id: orgId,
        extra_texts: extraTexts,
        expires_at: new Date(expiresAt).toISOString(),
        note: note.trim() || null,
      });
      const orgName = orgs.find(o => o.id === orgId)?.name ?? 'org';
      setSuccessFor(orgName);
      await fetchAll();
      setTimeout(() => setSuccessFor(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant gift');
    } finally {
      setSaving(false);
    }
  };

  const onEndEarly = async (gift: ActiveGift) => {
    if (!confirm(`End ${gift.name}'s gift now?`)) return;
    try {
      await setOrgBonus({
        org_id: gift.id,
        extra_texts: 0,
        expires_at: null,
        note: null,
      });
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end gift');
    }
  };

  if (loading) return null;

  return (
    <div className="admin-section">
      <h2>Gift extra texts</h2>
      <p className="admin-subtitle">One-time bonus with a warm message. Auto-expires.</p>

      <form className="gift-form" onSubmit={onGrant}>
        <div className="gift-form-row">
          <label className="gift-field">
            <span>Customer</span>
            <select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </label>
          <label className="gift-field">
            <span>Extra texts</span>
            <input
              type="number"
              min={1}
              value={extraTexts}
              onChange={(e) => setExtraTexts(Number(e.target.value))}
            />
          </label>
          <label className="gift-field">
            <span>Expires at (UTC)</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
        </div>
        <label className="gift-field gift-field--full">
          <span>Message they'll see</span>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A little extra this month — on us."
          />
        </label>
        {error && <div className="gift-error">{error}</div>}
        {successFor && (
          <div className="gift-success">
            Gift sent to <strong>{successFor}</strong> — it shows in their chip on next page load.
          </div>
        )}
        <button
          type="submit"
          className="gift-submit"
          disabled={saving}
        >
          {saving ? 'Sending…' : 'Send gift'}
        </button>
      </form>

      {activeGifts.length > 0 && (
        <div className="gift-active">
          <h3>Active gifts</h3>
          <div className="gift-active-list">
            {activeGifts.map((g) => (
              <div key={g.id} className="gift-active-row">
                <div className="gift-active-main">
                  <div className="gift-active-name">{g.name}</div>
                  <div className="gift-active-meta">
                    +{g.bonus_extra_texts.toLocaleString()} texts · until{' '}
                    {new Date(g.bonus_expires_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                  {g.bonus_note && (
                    <div className="gift-active-note">&ldquo;{g.bonus_note}&rdquo;</div>
                  )}
                </div>
                <button
                  type="button"
                  className="gift-end-btn"
                  onClick={() => onEndEarly(g)}
                >
                  End early
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
