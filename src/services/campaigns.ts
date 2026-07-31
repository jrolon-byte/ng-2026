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

/**
 * Queue a campaign send. The server validates and returns immediately —
 * the actual Twilio sending runs in a background worker. Poll
 * getCampaignStatus() until status leaves queued/sending for the outcome.
 * idempotency_key makes retries safe: the same key returns the existing
 * campaign instead of blasting everyone twice.
 */
export async function sendCampaign(data: {
  body: string;
  image_url?: string;
  idempotency_key: string;
}): Promise<{ campaign_id: string; total_recipients: number; already_queued?: boolean }> {
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

export interface CampaignStatus {
  id: string;
  status: 'queued' | 'sending' | 'completed' | 'failed' | string;
  total_recipients: number;
  total_delivered: number;
  total_failed: number;
}

export async function getCampaignStatus(campaignId: string): Promise<CampaignStatus> {
  const response = await fetch(
    `${BASE_URL}/campaign-status?campaign_id=${encodeURIComponent(campaignId)}`,
    { method: 'GET', headers: getHeaders() },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to check status' }));
    throw new Error(error.error || 'Failed to check status');
  }

  const data = await response.json();
  return data.campaign;
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
