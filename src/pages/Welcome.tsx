import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SetPasswordCard from '../components/SetPasswordCard';
import AuthShell from '../components/AuthShell';

/**
 * /welcome?t=TOKEN — the link in the welcome text. Same set-password
 * screen as /signup/success, for the customer who paid on their phone and
 * closed the tab (or paid on the shop iPad and is now on the couch).
 */
export default function Welcome() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');
  const navigate = useNavigate();
  const { setUserAndToken } = useAuth();

  if (!token) {
    return (
      <AuthShell>
        <div className="ng-auth-card ng-auth-success">
          <span className="ng-auth-eyebrow">
            <span className="ng-dot" aria-hidden="true"></span>
            Setup link
          </span>
          <h1 className="ng-auth-title">
            That link is <em>missing a piece.</em>
          </h1>
          <p className="ng-auth-sub">
            Open the setup link from your welcome text exactly as it was sent. Already have a
            password? Just log in.
          </p>
          <Link to="/login" className="ng-auth-submit" style={{ textDecoration: 'none' }}>
            Go to log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell trust="★ YOUR TEXTS ARE READY · UNLIMITED CONTACTS ★">
      <SetPasswordCard
        token={token}
        onDone={(auth) => {
          setUserAndToken(auth.user, auth.token);
          navigate('/engage?welcome=1', { replace: true });
        }}
      />
    </AuthShell>
  );
}
