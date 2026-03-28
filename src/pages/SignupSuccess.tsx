import { Link } from 'react-router-dom';
import ngLogo from '../imgs/ng.png';

export default function SignupSuccess() {
  return (
    <div>
      <nav className="signup-nav">
        <div className="signup-nav-inner">
          <div className="signup-nav-brand">
            <img src={ngLogo} alt="NotifyGrid" style={{ height: 32 }} />
          </div>
          <Link to="/login" className="signup-nav-login">Log In</Link>
        </div>
      </nav>

      <div className="signup-page">
        <div className="signup-card center">
          <p style={{ fontSize: 48, marginBottom: 8 }}>&#x1F4F2;</p>
          <h2>Welcome to NotifyGrid!</h2>
          <p style={{ color: '#888', lineHeight: 1.6, fontSize: 15, marginBottom: 24 }}>
            Your account is ready. Log in to add your customers and send your first text.
          </p>
          <Link
            to="/login"
            className="btn btn-blue"
            style={{
              color: 'white',
              background: '#3399ff',
              display: 'inline-block',
              textDecoration: 'none',
            }}
          >
            Log In →
          </Link>
        </div>
      </div>
    </div>
  );
}
