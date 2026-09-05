import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { startSignupCheckout } from '../services/signup';
import { track } from '../utils/analytics';
import Loader from '../components/Loader';
import ngMark from '../imgs/ng-mark.png';

/**
 * Pay-first signup: ONE screen, ONE button. The customer types nothing
 * here — Stripe Checkout collects email, phone, name and business name,
 * and on a phone that is a single Apple Pay / Google Pay tap. The
 * password comes after the money, on /signup/success.
 *
 * Referral links land here as /signup?ref=CODE and flip the offer to Pro.
 * The code field is hidden unless a code is present or the customer asks
 * for it — an empty "code" box sends people off hunting for discounts.
 */
export default function Signup() {
  const [searchParams] = useSearchParams();
  const initialRef = (searchParams.get('ref') ?? '').toUpperCase();
  const [referralCode, setReferralCode] = useState(initialRef);
  const [showCodeField, setShowCodeField] = useState(initialRef.length > 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReferral = referralCode.trim().length > 0;

  const onContinue = async () => {
    setError(null);
    setBusy(true);
    track('begin_checkout', {
      currency: 'USD',
      value: isReferral ? 49 : 5,
      items: [{ item_name: isReferral ? 'Pro (referred)' : 'First Blast' }],
    });
    try {
      const url = await startSignupCheckout(isReferral ? referralCode : undefined);
      window.location.href = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

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
          <div className="ng-auth-card">
            <span className="ng-auth-eyebrow">
              <span className="ng-dot" aria-hidden="true"></span>
              {isReferral ? 'Referral · Pro Plan' : 'First Blast · $5'}
            </span>

            <h1 className="ng-auth-title">
              {isReferral ? (
                <>Your friend <em>hooked you up.</em></>
              ) : (
                <>Send your <em>first blast.</em></>
              )}
            </h1>
            <p className="ng-auth-sub">
              {isReferral ? (
                <>
                  Start on <strong>Pro</strong> — 1,500 texts every month for{' '}
                  <strong>$49/mo</strong>. Cancel anytime.
                </>
              ) : (
                <>
                  One payment of <strong>$5</strong>. No auto-renew, no contract, no
                  card kept on file.
                </>
              )}
            </p>

            <ul className="ng-auth-offer" aria-label="What you get">
              {isReferral ? (
                <>
                  <li>1,500 texts every month</li>
                  <li>Unlimited contacts</li>
                  <li>Scheduled campaigns and segments</li>
                  <li>Two-way reply inbox</li>
                </>
              ) : (
                <>
                  <li>100 texts, ready the second you pay</li>
                  <li>Unlimited contacts</li>
                  <li>Template library</li>
                  <li>Two-way reply inbox</li>
                </>
              )}
            </ul>

            {showCodeField ? (
              <div className="ng-auth-field">
                <label className="ng-auth-label" htmlFor="ng-ref">
                  Referral code <span className="ng-auth-optional">(optional)</span>
                </label>
                <input
                  id="ng-ref"
                  className="ng-auth-input"
                  type="text"
                  placeholder="TONY-XXXX"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                />
              </div>
            ) : (
              <button
                type="button"
                className="ng-auth-toggle-link"
                onClick={() => setShowCodeField(true)}
              >
                Have a referral code?
              </button>
            )}

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
              <button type="button" className="ng-auth-submit" onClick={onContinue}>
                {isReferral ? 'Continue to secure checkout' : 'Pay $5 and start'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>
            )}

            <p className="ng-auth-fineprint">
              Apple Pay · Google Pay · Link · Card — secure checkout by Stripe
            </p>
            <p className="ng-auth-fineprint">
              By continuing you agree to our <Link to="/terms">Terms of Use</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>

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
