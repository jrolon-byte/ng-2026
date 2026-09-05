import { useState } from 'react';
import { Link } from 'react-router-dom';
import { setSignupPassword } from '../services/signup';
import type { AuthResponse } from '../types';
import Loader from '../components/Loader';

const MIN_LENGTH = 8;

interface Props {
  token: string;
  businessName?: string | null;
  onDone: (auth: AuthResponse) => void;
}

/**
 * The one screen after the money: choose a password, land in the app.
 * Shared by /signup/success (token from signup-claim) and /welcome
 * (token from the welcome text) so both paths are literally the same UI.
 */
export default function SetPasswordCard({ token, businessName, onDone }: Props) {
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const auth = await setSignupPassword(token, password);
      onDone(auth);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <div className="ng-auth-card">
      <span className="ng-auth-eyebrow">
        <span className="ng-dot" aria-hidden="true"></span>
        Payment confirmed
      </span>

      <h1 className="ng-auth-title">
        You're <em>in.</em>
      </h1>
      <p className="ng-auth-sub">
        {businessName ? (
          <>
            <strong>{businessName}</strong> is live. Choose a password and we'll drop you
            straight into your first blast.
          </>
        ) : (
          <>Choose a password and we'll drop you straight into your first blast.</>
        )}
      </p>

      <form className="ng-auth-form" onSubmit={onSubmit}>
        <div className="ng-auth-field">
          <label className="ng-auth-label" htmlFor="ng-new-pass">
            Choose a password
          </label>
          <div className="ng-auth-input-wrap">
            <input
              id="ng-new-pass"
              className="ng-auth-input"
              type={reveal ? 'text' : 'password'}
              placeholder={`At least ${MIN_LENGTH} characters`}
              autoComplete="new-password"
              autoFocus
              minLength={MIN_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="ng-auth-reveal"
              onClick={() => setReveal((v) => !v)}
              aria-pressed={reveal}
            >
              {reveal ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && (
          <p className="ng-auth-error" role="alert">
            {error}
          </p>
        )}

        {busy ? (
          <div className="ng-auth-loader">
            <Loader />
          </div>
        ) : (
          <button type="submit" className="ng-auth-submit">
            Save and start sending
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </button>
        )}

        <p className="ng-auth-fineprint">
          You can sign in with the email you used at checkout.
        </p>
      </form>

      <p className="ng-auth-meta">
        Already set one? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
