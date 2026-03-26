import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || username.length < 3) {
      alert('Please enter username and password');
      return;
    }
    doLogin();
  };

  const doLogin = async () => {
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
    <div className="container">
      <h2 className="center">Welcome</h2>
      <form className="add-form">
        <div className="form-control">
          <input
            type="text"
            placeholder="user name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-control">
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            Login
          </button>
        )}
      </form>
    </div>
  );
}
