import { BASE_URL } from '../config/api';
import type { DashboardStats } from '../types';

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

export async function getStats(): Promise<DashboardStats> {
  const response = await fetch(`${BASE_URL}/dashboard-stats`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch stats' }));
    throw new Error(error.error || 'Failed to fetch stats');
  }

  return response.json();
}
