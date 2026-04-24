import { Link } from 'react-router-dom';

export default function SignupSuccess() {
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
          <Link to="/login" className="ng-auth-back">
            Log in
          </Link>
        </div>
      </header>

      <main className="ng-auth-main">
        <div>
          <div className="ng-auth-card ng-auth-success">
            <div className="ng-auth-success-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>

            <span className="ng-auth-eyebrow">
              <span className="ng-dot" aria-hidden="true"></span>
              Payment confirmed
            </span>

            <h1 className="ng-auth-title">
              You're <em>in.</em>
            </h1>
            <p className="ng-auth-sub">
              Your account is live. Log in to import your customers and fire your first
              blast — the one Tony's been running for nine years.
            </p>

            <Link to="/login" className="ng-auth-submit" style={{ textDecoration: 'none' }}>
              Log in and start sending
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>

            <p className="ng-auth-fineprint">
              Check your email for your receipt from Stripe.
            </p>
          </div>

          <p className="ng-auth-trust">
            ★ <strong>100 TEXTS</strong> READY · UNLIMITED CONTACTS · NO AUTO-RENEW ★
          </p>
        </div>
      </main>
    </div>
  );
}
