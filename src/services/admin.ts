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

export interface SetBonusResult {
  success: true;
  sms_warning: string | null;
}

export async function setOrgBonus(params: {
  org_id: string;
  extra_texts: number;
  expires_at: string | null;
  note: string | null;
  send_sms?: boolean;
  sms_message?: string;
}): Promise<SetBonusResult> {
  const res = await fetch(`${BASE_URL}/admin-set-bonus`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update gift' }));
    throw new Error(err.error || 'Failed to update gift');
  }
  return res.json();
}

export type CompanyPlan = 'comped' | 'starter' | 'pro' | 'enterprise';

export interface CreateCompanyParams {
  business_name: string;
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  phone: string;
  plan: CompanyPlan;
  /** Required when plan === 'comped'. */
  text_limit?: number;
  locale: 'en' | 'es';
}

export interface CreateCompanyResult {
  success: true;
  org: { id: string; name: string; slug: string; plan: CompanyPlan; text_limit: number };
  user: { username: string; email: string; first_name: string; last_name: string };
}

export async function createCompany(params: CreateCompanyParams): Promise<CreateCompanyResult> {
  const res = await fetch(`${BASE_URL}/admin-org-create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create company' }));
    throw new Error(err.error || 'Failed to create company');
  }
  return res.json();
}

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  locale: 'en' | 'es';
  plan_status: string;
  text_limit: number;
  active: boolean;
  created_at: string;
  username: string | null;
  texts_this_month: number;
  has_stripe: boolean;
  bonus_extra_texts: number;
  bonus_expires_at: string | null;
}

export async function listCompanies(): Promise<AdminCompany[]> {
  const res = await fetch(`${BASE_URL}/admin-orgs-list`, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load companies' }));
    throw new Error(err.error || 'Failed to load companies');
  }
  const data = await res.json();
  return data.companies ?? [];
}

export async function updateCompany(params: {
  org_id: string;
  name?: string;
  phone?: string;
  locale?: 'en' | 'es';
  plan?: CompanyPlan;
  text_limit?: number;
}): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}/admin-org-update`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update company' }));
    throw new Error(err.error || 'Failed to update company');
  }
  return res.json();
}

export async function setCompanyActive(org_id: string, active: boolean): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}/admin-org-set-active`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ org_id, active }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update company' }));
    throw new Error(err.error || 'Failed to update company');
  }
  return res.json();
}
