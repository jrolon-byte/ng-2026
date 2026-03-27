export interface Organization {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  plan_tier: string;
  active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  active: boolean;
  created_at: string;
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

export interface DashboardStats {
  sms_this_month: number;
  sms_lifetime: number;
  total_contacts: number;
  total_campaigns: number;
  text_limit: number;
  grace_limit: number;
  reset_date: string;
  admin?: AdminStats;
}

export interface AuthResponse {
  user: User;
  token: string;
}
