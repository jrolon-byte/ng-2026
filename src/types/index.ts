export interface Organization {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  /** first_blast | active | past_due | cancelled — the DB column is plan_status (plan_tier never existed). */
  plan_status: string;
  active: boolean;
  created_at: string;
}

/**
 * The auth user as the API actually returns it (auth-login / auth-refresh:
 * JWT claims + username + last_name). `active`/`created_at` were phantom
 * fields no auth response ever included. `username` is optional because
 * orgs-switch re-mints the payload without it.
 */
export interface User {
  id: string;
  org_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username?: string;
}

export interface Contact {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  opted_in: boolean;
  active: boolean;
  created_at: string;
  /** Replies not yet seen. contacts-list has always returned these three
   *  signal fields — the web ignored them until 2026-08. */
  unread_replies: number;
  last_reply_at: string | null;
  consecutive_failures: number;
}

/** Nothing has arrived at this number in a long time. Mirrors the iOS rule
 *  (`Contact.isUndeliverable`): a reply proves the number is alive, so it
 *  overrides any failure streak. */
export function isUndeliverable(c: Contact): boolean {
  return (c.consecutive_failures ?? 0) >= 3 && (c.unread_replies ?? 0) === 0;
}

export interface Campaign {
  id: string;
  org_id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  total_recipients: number;
  total_delivered: number;
  total_failed: number;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export interface MessageLog {
  id: string;
  org_id: string;
  campaign_id: string;
  contact_id: string;
  body: string;
  segments: number;
  twilio_sid: string;
  status: string;
  cost: number;
  sent_at: string | null;
  created_at: string;
}

export interface AdminStats {
  global_sms_this_month: number;
  global_sms_lifetime: number;
  cost_this_month: number;
  cost_lifetime: number;
  phone_monthly: number;
  total_orgs: number;
}

export interface BonusGift {
  extra_texts: number;
  expires_at: string;
  note: string;
}

export interface DashboardStats {
  sms_this_month: number;
  sms_lifetime: number;
  total_contacts: number;
  total_campaigns: number;
  text_limit: number;
  grace_limit: number;
  reset_date: string;
  /** Active per-org one-time bonus, or null if none. Auto-clears after expires_at. */
  bonus: BonusGift | null;
  /** Paywall locale for this org. Defaults 'en'. Currently only 'en' | 'es' supported. */
  locale: string;
  admin?: AdminStats;
}

export interface AuthResponse {
  user: User;
  token: string;
}
