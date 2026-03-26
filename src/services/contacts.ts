import { BASE_URL } from '../config/api';
import type { Contact } from '../types';

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

export async function getContacts(): Promise<Contact[]> {
  const response = await fetch(`${BASE_URL}/contacts-list`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch contacts' }));
    throw new Error(error.error || 'Failed to fetch contacts');
  }

  const data = await response.json();
  return data.contacts ?? [];
}

export async function createContact(data: {
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
}): Promise<Contact> {
  const response = await fetch(`${BASE_URL}/contacts-create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create contact' }));
    throw new Error(error.error || 'Failed to create contact');
  }

  const result = await response.json();
  return result.contact;
}

export async function deleteContact(contactId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/contacts-delete?contact_id=${contactId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete contact' }));
    throw new Error(error.error || 'Failed to delete contact');
  }
}
