import { BASE_URL } from '../config/api';
import type { Campaign } from '../types';

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

export async function sendCampaign(data: {
  body: string;
  image_url?: string;
}): Promise<{ campaign_id: string; total_contacts: number; total_sent: number; total_failed: number }> {
  const response = await fetch(`${BASE_URL}/campaign-send`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send campaign' }));
    throw new Error(error.error || 'Failed to send campaign');
  }

  return response.json();
}

export async function getCampaigns(): Promise<Campaign[]> {
  const response = await fetch(`${BASE_URL}/campaigns-list`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch campaigns' }));
    throw new Error(error.error || 'Failed to fetch campaigns');
  }

  const data = await response.json();
  return data.campaigns ?? [];
}
