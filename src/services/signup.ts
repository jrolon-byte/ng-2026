import { BASE_URL } from '../config/api';
import type { AuthResponse } from '../types';

/**
 * Pay-first signup, client side. Three calls, in funnel order:
 *   startSignupCheckout → Stripe Checkout URL (the customer types nothing here)
 *   claimSignupSession  → account provisioned + one-time setup token
 *   setSignupPassword   → password chosen, session minted (same shape as login)
 */

async function readError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return typeof data?.error === 'string' ? data.error : fallback;
}

export async function startSignupCheckout(referralCode?: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/stripe-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'signup',
      ...(referralCode?.trim() ? { referralCode: referralCode.trim() } : {}),
    }),
  });
  if (!res.ok) throw new Error(await readError(res, 'Could not start checkout'));
  const data = await res.json();
  if (typeof data?.url !== 'string') throw new Error('Could not start checkout');
  return data.url;
}

export type ClaimResult =
  | { status: 'pending' }
  | {
      status: 'ready';
      already_set: true;
      business_name: string;
      username: string;
      amount_total: number;
      currency: string;
    }
  | {
      status: 'ready';
      already_set: false;
      setup_token: string;
      business_name: string;
      username: string;
      first_name: string;
      amount_total: number;
      currency: string;
    };

export async function claimSignupSession(sessionId: string): Promise<ClaimResult> {
  const res = await fetch(`${BASE_URL}/signup-claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (res.status === 202) return { status: 'pending' };
  if (!res.ok) throw new Error(await readError(res, 'Could not confirm your payment'));
  return res.json();
}

export async function setSignupPassword(
  token: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/signup-set-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) throw new Error(await readError(res, 'Could not set your password'));
  return res.json();
}
