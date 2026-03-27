import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPhoneInput } from '../utils/formatPhoneInput';
import { BASE_URL } from '../config/api';
import Loader from '../components/Loader';

export default function Signup() {
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showLoader, setShowLoader] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !name || !username || !password || !phone) {
      alert('Please fill in all fields');
      return;
    }
    if (username.length < 3) {
      alert('Username must be at least 3 characters');
      return;
    }
    doSignup();
  };

  const doSignup = async () => {
    setShowLoader(true);
    try {
      const res = await fetch(`${BASE_URL}/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'signup',
          businessName,
          name,
          username,
          password,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      window.location.href = data.url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
      setShowLoader(false);
    }
  };

  return (
    <div className="container">
      <h2 className="center">Get Started</h2>
      <p className="center" style={{ color: '#666', marginBottom: 20 }}>
        $5 for your first blast
      </p>
      <form className="add-form">
        <div className="form-control">
          <input
            type="text"
            placeholder="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            required
          />
        </div>
        {showLoader ? (
          <Loader />
        ) : (
          <button
            onClick={onSubmit}
            className="btn btn-block"
            style={{ color: 'white', background: 'black' }}
          >
            Continue to Payment &rarr;
          </button>
        )}
      </form>
      <p className="center" style={{ marginTop: 20 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
