import { BASE_URL } from '../config/api';
import type { AuthResponse } from '../types';

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

export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/auth-login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}

export async function logout(): Promise<void> {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}
