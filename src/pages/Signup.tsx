import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPhoneInput } from '../utils/formatPhoneInput';
import { BASE_URL } from '../config/api';
import Loader from '../components/Loader';

export default function Signup() {
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showLoader, setShowLoader] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !name || !username || !password || !phone) {
      alert('Please fill in all fields');
      return;
    }
    if (username.length < 3) {
      alert('Username must be at least 3 characters');
      return;
    }
    setShowLoader(true);
    try {
      const res = await fetch(`${BASE_URL}/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'signup',
          businessName,
          name,
          username,
          password,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      window.location.href = data.url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
      setShowLoader(false);
    }
  };

  return (
    <div className="ng-auth">
      <header className="ng-auth-topbar">
        <div className="ng-auth-topbar-inner">
          <a className="ng-auth-logo" href="https://notifygrid.com/">
            <span className="ng-auth-logo-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 19V5h2.5l9 10V5H19v14h-2.5l-9-10v10H5z" fill="white" />
                <circle cx="19" cy="6" r="3" fill="white" />
              </svg>
            </span>
            NotifyGrid
          </a>
          {businessName && (
            <span className="ng-auth-shop-pill" aria-live="polite">
              {businessName}
            </span>
          )}
          <Link to="/login" className="ng-auth-back">
            Log in
          </Link>
        </div>
      </header>

      <main className="ng-auth-main">
        <div>
          <div className="ng-auth-card ng-auth-card-wide">
            <span className="ng-auth-eyebrow">
              <span className="ng-dot" aria-hidden="true"></span>
              First Blast · $5
            </span>

            <h1 className="ng-auth-title">
              Start your <em>first blast.</em>
            </h1>
            <p className="ng-auth-sub">
              100 texts to unlimited contacts. One payment of <strong>$5</strong> — no
              auto-renew, no contract.
            </p>

            <form className="ng-auth-form" onSubmit={onSubmit}>
              <div className="ng-auth-field">
                <label className="ng-auth-label" htmlFor="ng-biz">
                  Business name
                </label>
                <input
                  id="ng-biz"
                  className="ng-auth-input"
                  type="text"
                  placeholder="Tony Touch Barbershop"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="ng-auth-field">
                <label className="ng-auth-label" htmlFor="ng-name">
                  Your name
                </label>
                <input
                  id="ng-name"
                  className="ng-auth-input"
                  type="text"
                  placeholder="Tony Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="ng-auth-row">
                <div className="ng-auth-field">
                  <label className="ng-auth-label" htmlFor="ng-user">
                    Username
                  </label>
                  <input
                    id="ng-user"
                    className="ng-auth-input"
                    type="text"
                    placeholder="tonytouch"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="ng-auth-field">
                  <label className="ng-auth-label" htmlFor="ng-pass">
                    Password
                  </label>
                  <input
                    id="ng-pass"
                    className="ng-auth-input"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="ng-auth-field">
                <label className="ng-auth-label" htmlFor="ng-phone">
                  Shop phone
                </label>
                <input
                  id="ng-phone"
                  className="ng-auth-input"
                  type="tel"
                  placeholder="(407) 555-0134"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  maxLength={14}
                  required
                />
              </div>

              {showLoader ? (
                <div className="ng-auth-loader">
                  <Loader />
                </div>
              ) : (
                <button type="submit" className="ng-auth-submit">
                  Continue to payment
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </button>
              )}

              <p className="ng-auth-fineprint">
                Secure checkout by Stripe. Cancel anytime before your first blast.
              </p>
            </form>

            <p className="ng-auth-meta">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>

          <p className="ng-auth-trust">
            ★ <strong>9 YEARS</strong> SERVING LOCAL SHOPS · BUILT IN KISSIMMEE, FL ★
          </p>
        </div>
      </main>
    </div>
  );
}
