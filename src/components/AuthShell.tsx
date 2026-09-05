import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ngMark from '../imgs/ng-mark.png';

interface Props {
  children: ReactNode;
  /** Mono trust line under the card. */
  trust?: ReactNode;
}

/**
 * Topbar + centered card frame shared by the post-payment screens
 * (/signup/success, /welcome). Login and Signup still render their own
 * copy of this frame; folding them in is a follow-up, not a behaviour change.
 */
export default function AuthShell({ children, trust }: Props) {
  return (
    <div className="ng-auth">
      <header className="ng-auth-topbar">
        <div className="ng-auth-topbar-inner">
          <a className="ng-auth-logo" href="https://notifygrid.com/">
            <img className="ng-auth-logo-mark" src={ngMark} alt="" aria-hidden="true" />
            NotifyGrid
          </a>
          <Link to="/login" className="ng-auth-back">
            Log in
          </Link>
        </div>
      </header>

      <main className="ng-auth-main">
        <div>
          {children}
          {trust && <p className="ng-auth-trust">{trust}</p>}
        </div>
      </main>
    </div>
  );
}
