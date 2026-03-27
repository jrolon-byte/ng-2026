import { Link } from 'react-router-dom';

export default function SignupSuccess() {
  return (
    <div className="container">
      <div className="center">
        <p style={{ fontSize: 48, marginBottom: 0 }}>&#x1F4F2;</p>
        <h2>Welcome to NotifyGrid!</h2>
        <p style={{ color: '#666', lineHeight: 1.6 }}>
          Your account is ready. Log in to add your customers and send your
          first text.
        </p>
        <Link
          to="/login"
          className="btn btn-block"
          style={{
            color: 'white',
            background: 'black',
            display: 'inline-block',
            marginTop: 20,
            textDecoration: 'none',
          }}
        >
          Log In &rarr;
        </Link>
      </div>
    </div>
  );
}
