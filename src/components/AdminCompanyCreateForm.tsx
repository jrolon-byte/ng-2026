import { useState } from 'react';
import {
  createCompany,
  type CompanyPlan,
  type CreateCompanyResult,
} from '../services/admin';

/**
 * Create-company form + one-time credentials card. Lives inside the
 * /admin/companies page; enforcement is the 403 in admin-org-create.
 * The password is never retrievable after creation — the success card
 * is the moment to copy it.
 */

const PLAN_LABELS: Record<CompanyPlan, string> = {
  comped: 'Comped — on the house, custom limit',
  starter: 'Starter — 600 texts/mo ($29 when billed)',
  pro: 'Pro — 1,500 texts/mo ($49 when billed)',
  enterprise: 'Enterprise — 4,000 texts/mo ($149 when billed)',
};

function generatePassword(): string {
  // Readable but strong: 3 groups of 4 from an unambiguous alphabet.
  const alphabet = 'abcdefghjkmnpqrstuvwxyzACDEFHJKLMNPRTUVWXY345679';
  const pick = () =>
    Array.from(crypto.getRandomValues(new Uint32Array(4)))
      .map((n) => alphabet[n % alphabet.length])
      .join('');
  return `${pick()}-${pick()}-${pick()}`;
}

export default function AdminCompanyCreateForm({ onCreated }: { onCreated: () => void }) {
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [locale, setLocale] = useState<'en' | 'es'>('en');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [plan, setPlan] = useState<CompanyPlan>('comped');
  const [compedLimit, setCompedLimit] = useState(600);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CreateCompanyResult | null>(null);
  const [createdPassword, setCreatedPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !firstName.trim() || !username.trim() || !password) {
      setError('Business name, contact first name, username, and password are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await createCompany({
        business_name: businessName.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        plan,
        text_limit: plan === 'comped' ? compedLimit : undefined,
        locale,
      });
      setCreated(result);
      setCreatedPassword(password);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCreated(null);
    setCreatedPassword('');
    setBusinessName('');
    setPhone('');
    setFirstName('');
    setLastName('');
    setUsername('');
    setPassword(generatePassword());
    setPlan('comped');
    setCompedLimit(600);
    setError('');
  };

  if (created) {
    return (
      <div className="newco-success">
        <h3>
          {created.org.name} is live <span aria-hidden>🎉</span>
        </h3>
        <div className="newco-creds">
          <div className="newco-cred-row">
            <span>Login URL</span>
            <code>{window.location.origin}/login</code>
          </div>
          <div className="newco-cred-row">
            <span>Username</span>
            <code>{created.user.username}</code>
          </div>
          <div className="newco-cred-row">
            <span>Password</span>
            <code>{createdPassword}</code>
          </div>
          <div className="newco-cred-row">
            <span>Plan</span>
            <code>
              {created.org.plan} · {created.org.text_limit.toLocaleString()} texts/mo
            </code>
          </div>
        </div>
        <div className="newco-actions">
          <button
            type="button"
            className="gift-submit"
            onClick={() =>
              navigator.clipboard.writeText(
                `NotifyGrid login for ${created.org.name}\n${window.location.origin}/login\nUsername: ${created.user.username}\nPassword: ${createdPassword}`,
              )
            }
          >
            Copy credentials
          </button>
          <button type="button" className="newco-again" onClick={resetForm}>
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="gift-form" onSubmit={onSubmit}>
      <div className="gift-form-row">
        <label className="gift-field">
          <span>Business name</span>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Tony Touch Barber Shop"
          />
        </label>
        <label className="gift-field">
          <span>Business phone (optional)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(407) 555-0142"
          />
        </label>
        <label className="gift-field">
          <span>Language</span>
          <select value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'es')}>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </label>
      </div>

      <div className="gift-form-row">
        <label className="gift-field">
          <span>Owner first name</span>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label className="gift-field">
          <span>Owner last name</span>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
      </div>

      <div className="gift-form-row">
        <label className="gift-field">
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="tonytouch"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </label>
        <label className="gift-field">
          <span>Password</span>
          <div className="newco-pass">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button
              type="button"
              className="newco-regen"
              title="Generate a new password"
              onClick={() => setPassword(generatePassword())}
            >
              ↻
            </button>
          </div>
        </label>
      </div>

      <div className="gift-form-row">
        <label className="gift-field">
          <span>Plan</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value as CompanyPlan)}>
            {(Object.keys(PLAN_LABELS) as CompanyPlan[]).map((p) => (
              <option key={p} value={p}>
                {PLAN_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        {plan === 'comped' && (
          <label className="gift-field">
            <span>Monthly text limit</span>
            <input
              type="number"
              min={0}
              max={100000}
              value={compedLimit}
              onChange={(e) => setCompedLimit(Number(e.target.value))}
            />
          </label>
        )}
      </div>

      {error && <div className="gift-error">{error}</div>}

      <button type="submit" className="gift-submit" disabled={saving}>
        {saving ? 'Creating…' : 'Create company'}
      </button>
    </form>
  );
}
