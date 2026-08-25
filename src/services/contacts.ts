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

export interface BulkCreateResult {
  created: number;
  merged: number;
  reactivated: number;
  invalid: { first_name: string; phone: string; reason: string }[];
}

export async function bulkCreateContacts(contacts: {
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
}[]): Promise<BulkCreateResult> {
  const response = await fetch(`${BASE_URL}/contacts-bulk-create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ contacts }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to import contacts' }));
    throw new Error(error.error || 'Failed to import contacts');
  }

  return response.json();
}

export async function updateContact(data: {
  contact_id: string;
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
}): Promise<Contact> {
  const response = await fetch(`${BASE_URL}/contacts-update`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to save changes' }));
    throw new Error(error.error || 'Failed to save changes');
  }

  const result = await response.json();
  return result.contact;
}

export interface ThreadMessage {
  id: string;
  direction: 'outbound' | 'inbound';
  body: string;
  created_at: string | null;
  status: string | null;
}

export interface ContactThread {
  messages: ThreadMessage[];
  /** Older broadcasts the server windowed out of the thread. */
  omitted_count: number;
}

/** The conversation with one customer. `markRead` clears their unread-reply
 *  flag server-side — opening the thread IS reading it. */
export async function getContactMessages(
  contactId: string,
  markRead: boolean,
): Promise<ContactThread> {
  const params = `contact_id=${contactId}${markRead ? '&mark_read=1' : ''}`;
  const response = await fetch(`${BASE_URL}/contact-messages?${params}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to load conversation' }));
    throw new Error(error.error || 'Failed to load conversation');
  }

  const data = await response.json();
  return { messages: data.messages ?? [], omitted_count: data.omitted_count ?? 0 };
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
