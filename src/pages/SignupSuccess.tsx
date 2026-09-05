import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { claimSignupSession } from '../services/signup';
import type { ClaimResult } from '../services/signup';
import { trackPurchaseOnce } from '../utils/analytics';
import SetPasswordCard from '../components/SetPasswordCard';
import AuthShell from '../components/AuthShell';
import Loader from '../components/Loader';

// Stripe redirects the browser before its webhook has necessarily landed,
// and provisioning itself takes a second or two. Poll the claim endpoint
// (which provisions on its own if the webhook hasn't) for up to ~20 s.
const POLL_INTERVAL_MS = 2000;
const POLL_ATTEMPTS = 10;

type State =
  | { kind: 'claiming' }
  | { kind: 'set_password'; token: string; businessName: string }
  | { kind: 'already_set'; businessName: string }
  | { kind: 'error'; message: string };

export default function SignupSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { setUserAndToken } = useAuth();
  // No session id is a dead end we know at mount time, so it is the
  // initial state rather than something an effect discovers.
  const [state, setState] = useState<State>(() =>
    sessionId
      ? { kind: 'claiming' }
      : {
          kind: 'error',
          message:
            "We couldn't find your checkout session. If you paid, check your phone for the setup text.",
        },
  );
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    if (!sessionId) return;

    let attempt = 0;
    const tick = async () => {
      if (cancelled.current) return;
      attempt += 1;
      let result: ClaimResult;
      try {
        result = await claimSignupSession(sessionId);
      } catch (err: unknown) {
        if (cancelled.current) return;
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Something went wrong',
        });
        return;
      }
      if (cancelled.current) return;

      if (result.status === 'ready') {
        trackPurchaseOnce(sessionId, result.amount_total, result.currency);
        setState(
          result.already_set
            ? { kind: 'already_set', businessName: result.business_name }
            : {
                kind: 'set_password',
                token: result.setup_token,
                businessName: result.business_name,
              },
        );
        return;
      }

      if (attempt >= POLL_ATTEMPTS) {
        setState({
          kind: 'error',
          message:
            "Your payment went through and your account is still being set up. Check your phone for a setup text, or try logging in in a minute.",
        });
        return;
      }
      window.setTimeout(tick, POLL_INTERVAL_MS);
    };

    void tick();
    return () => {
      cancelled.current = true;
    };
  }, [sessionId]);

  if (state.kind === 'set_password') {
    return (
      <AuthShell trust="★ YOUR TEXTS ARE READY · UNLIMITED CONTACTS ★">
        <SetPasswordCard
          token={state.token}
          businessName={state.businessName}
          onDone={(auth) => {
            setUserAndToken(auth.user, auth.token);
            navigate('/engage?welcome=1', { replace: true });
          }}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell trust="★ 100 TEXTS READY · UNLIMITED CONTACTS · NO AUTO-RENEW ★">
      <div className="ng-auth-card ng-auth-success">
        {state.kind === 'claiming' && (
          <>
            <div className="ng-auth-loader">
              <Loader />
            </div>
            <span className="ng-auth-eyebrow">
              <span className="ng-dot" aria-hidden="true"></span>
              Confirming payment
            </span>
            <h1 className="ng-auth-title">
              Setting up <em>your shop.</em>
            </h1>
            <p className="ng-auth-sub">This takes a few seconds. Don't close the tab.</p>
          </>
        )}

        {state.kind === 'already_set' && (
          <>
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
              <strong>{state.businessName}</strong> is live. Log in to import your customers and
              fire your first blast.
            </p>
            <Link to="/login" className="ng-auth-submit" style={{ textDecoration: 'none' }}>
              Log in and start sending
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </>
        )}

        {state.kind === 'error' && (
          <>
            <span className="ng-auth-eyebrow">
              <span className="ng-dot" aria-hidden="true"></span>
              One more step
            </span>
            <h1 className="ng-auth-title">
              Almost <em>there.</em>
            </h1>
            <p className="ng-auth-sub">{state.message}</p>
            <Link to="/login" className="ng-auth-submit" style={{ textDecoration: 'none' }}>
              Go to log in
            </Link>
            <p className="ng-auth-fineprint">Check your email for your receipt from Stripe.</p>
          </>
        )}
      </div>
    </AuthShell>
  );
}
