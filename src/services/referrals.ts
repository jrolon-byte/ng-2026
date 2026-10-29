import { BASE_URL } from '../config/api';

function getHeaders(): HeadersInit {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ReferralRow {
  name: string;
  /** credited: the $5 landed; pending: signed up, not credited yet; ended: left before it did. */
  status: 'credited' | 'pending' | 'ended';
  since: string;
}

export interface ReferralStats {
  code: string;
  locale: 'en' | 'es';
  referrals: ReferralRow[];
  /** Referrals that earned their one-time $5. */
  credited_count: number;
  /** Total one-time credit earned, in cents. */
  credit_cents: number;
}

export async function getReferralStats(): Promise<ReferralStats> {
  const res = await fetch(`${BASE_URL}/referrals-stats`, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load referrals' }));
    throw new Error(err.error || 'Failed to load referrals');
  }
  return res.json();
}
