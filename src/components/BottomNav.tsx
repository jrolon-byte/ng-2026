import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdSend,
  MdDashboard,
  MdHistory,
  MdLogout,
} from 'react-icons/md';

export default function BottomNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { to: '/engage', label: 'Engage', icon: <MdSend /> },
    { to: '/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    { to: '/campaigns', label: 'Campaigns', icon: <MdHistory /> },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `bottom-nav-tab ${isActive ? 'bottom-nav-tab--active' : ''}`
          }
        >
          <span className="bottom-nav-tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
      <button className="bottom-nav-tab" onClick={handleLogout}>
        <span className="bottom-nav-tab-icon"><MdLogout /></span>
        <span>Logout</span>
      </button>
    </nav>
  );
}
