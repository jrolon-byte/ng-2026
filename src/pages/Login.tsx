import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || username.length < 3) {
      alert('Please enter username and password');
      return;
    }
    setShowLoader(true);
    try {
      await login(username, password);
      setUsername('');
      setPassword('');
      navigate('/engage');
    } catch {
      alert('Incorrect username or password');
    }
    setShowLoader(false);
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
                  Username
                </label>
                <input
                  id="ng-username"
                  className="ng-auth-input"
                  type="text"
                  placeholder="tonytouch"
                  autoComplete="username"
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
        </div>
      </main>
    </div>
  );
}
