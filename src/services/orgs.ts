import { BASE_URL } from '../config/api';

function getHeaders(): HeadersInit {
  const token = sessionStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface Org {
  id: string;
  name: string;
  slug: string;
}

export async function getOrgs(): Promise<Org[]> {
  const response = await fetch(`${BASE_URL}/orgs-list`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) return [];

  const data = await response.json();
  return data.orgs ?? [];
}

export interface OrgSettings {
  id: string;
  name: string;
  message_prefix: string | null;
  message_suffix: string | null;
  text_limit: number;
  plan_status: string | null;
}

export async function getOrgSettings(): Promise<OrgSettings | null> {
  const response = await fetch(`${BASE_URL}/org-settings`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.org ?? null;
}

export async function updateOrgSettings(data: {
  message_prefix: string;
  message_suffix: string;
}): Promise<void> {
  const response = await fetch(`${BASE_URL}/org-settings-update`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to save' }));
    throw new Error(error.error || 'Failed to save settings');
  }
}

export async function switchOrg(orgId: string): Promise<{ token: string; user: Record<string, unknown>; org: Org }> {
  const response = await fetch(`${BASE_URL}/orgs-switch`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ org_id: orgId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to switch' }));
    throw new Error(error.error || 'Failed to switch organization');
  }

  return response.json();
}
