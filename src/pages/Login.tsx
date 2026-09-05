import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ngMark from '../imgs/ng-mark.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      alert('Please enter your email or username and password');
      return;
    }
    setShowLoader(true);
    try {
      await login(username, password);
      setUsername('');
      setPassword('');
      navigate('/engage');
    } catch (err: unknown) {
      // The one non-credential failure worth naming: a pay-first signup
      // that hasn't chosen a password yet (server answers 409 with a hint).
      const message = err instanceof Error ? err.message : '';
      alert(
        message.startsWith('Finish setting up')
          ? message
          : 'Incorrect email/username or password',
      );
    }
    setShowLoader(false);
  };

  return (
    <div className="ng-auth">
      <header className="ng-auth-topbar">
        <div className="ng-auth-topbar-inner">
          <a className="ng-auth-logo" href="https://notifygrid.com/">
            <img className="ng-auth-logo-mark" src={ngMark} alt="" aria-hidden="true" />
            NotifyGrid
          </a>
          <a className="ng-auth-back" href="https://notifygrid.com/">
            ← Back to site
          </a>
        </div>
      </header>

      <main className="ng-auth-main">
        <div>
          <div className="ng-auth-card">
            <span className="ng-auth-eyebrow">
              <span className="ng-dot" aria-hidden="true"></span>
              Sign in
            </span>

            <h1 className="ng-auth-title">
              Welcome <em>back.</em>
            </h1>
            <p className="ng-auth-sub">
              Let's fill those chairs. Sign in to send your next campaign.
            </p>

            <form className="ng-auth-form" onSubmit={onSubmit}>
              <div className="ng-auth-field">
                <label className="ng-auth-label" htmlFor="ng-username">
                  Email or username
                </label>
                <input
                  id="ng-username"
                  className="ng-auth-input"
                  type="text"
                  placeholder="you@shop.com or tonytouch"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="ng-auth-field">
                <label className="ng-auth-label" htmlFor="ng-password">
                  Password
                </label>
                <input
                  id="ng-password"
                  className="ng-auth-input"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {showLoader ? (
                <div className="ng-auth-loader">
                  <Loader />
                </div>
              ) : (
                <button type="submit" className="ng-auth-submit">
                  Sign in
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </button>
              )}
            </form>

            <p className="ng-auth-meta">
              New here? <Link to="/signup">Try NotifyGrid for $5 →</Link>
            </p>
          </div>

          <p className="ng-auth-trust">
            ★ <strong>9 YEARS</strong> SERVING LOCAL SHOPS · BUILT IN KISSIMMEE, FL ★
          </p>
          <p className="ng-auth-legal-links">
            <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
