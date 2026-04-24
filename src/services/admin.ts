import { BASE_URL } from '../config/api';

function getHeaders(): HeadersInit {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ActiveGift {
  id: string;
  name: string;
  bonus_extra_texts: number;
  bonus_expires_at: string;
  bonus_note: string | null;
}

export async function listActiveGifts(): Promise<ActiveGift[]> {
  const res = await fetch(`${BASE_URL}/admin-gifts-list`, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load active gifts' }));
    throw new Error(err.error || 'Failed to load active gifts');
  }
  const data = await res.json();
  return data.gifts ?? [];
}

export async function setOrgBonus(params: {
  org_id: string;
  extra_texts: number;
  expires_at: string | null;
  note: string | null;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin-set-bonus`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update gift' }));
    throw new Error(err.error || 'Failed to update gift');
  }
}
