import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  title: string;
  titleAccent: string;
  effectiveDate: string;
  children: ReactNode;
}

/**
 * Shared shell for public legal documents (/privacy, /terms).
 * These pages must stay publicly reachable without auth — App Store
 * review, Twilio A2P campaign vetting, and SMS recipients all land here.
 */
export default function LegalPage({ title, titleAccent, effectiveDate, children }: Props) {
  return (
    <div className="ng-auth ng-legal">
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
          <a className="ng-auth-back" href="https://notifygrid.com/">
            ← Back to site
          </a>
        </div>
      </header>

      <main className="ng-legal-main">
        <article className="ng-legal-doc">
          <h1 className="ng-auth-title">
            {title} <em>{titleAccent}</em>
          </h1>
          <p className="ng-legal-date">Effective {effectiveDate}</p>
          {children}
          <footer className="ng-legal-foot">
            <Link to="/terms">Terms of Use</Link>
            <span aria-hidden="true">·</span>
            <Link to="/privacy">Privacy Policy</Link>
            <span aria-hidden="true">·</span>
            <a href="mailto:support@notifygrid.com">support@notifygrid.com</a>
          </footer>
        </article>
      </main>
    </div>
  );
}
