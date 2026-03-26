import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ngLogo from '../imgs/ng.png';

export default function TopNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <div className="topnav-brand">
          <img src={ngLogo} alt="NotifyGrid" style={{ height: 36 }} />
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className={`hamburger ${menuOpen ? 'hamburger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        {/* Desktop links */}
        <div className="topnav-links">
          <NavLink to="/engage" className={({ isActive }) => isActive ? 'topnav-link topnav-link--active' : 'topnav-link'}>
            Engage
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'topnav-link topnav-link--active' : 'topnav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/campaigns" className={({ isActive }) => isActive ? 'topnav-link topnav-link--active' : 'topnav-link'}>
            Campaigns
          </NavLink>
          <button className="topnav-link topnav-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
        <NavLink to="/engage" className={({ isActive }) => isActive ? 'mobile-menu-link mobile-menu-link--active' : 'mobile-menu-link'} onClick={closeMenu}>
          Engage
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'mobile-menu-link mobile-menu-link--active' : 'mobile-menu-link'} onClick={closeMenu}>
          Dashboard
        </NavLink>
        <NavLink to="/campaigns" className={({ isActive }) => isActive ? 'mobile-menu-link mobile-menu-link--active' : 'mobile-menu-link'} onClick={closeMenu}>
          Campaigns
        </NavLink>
        <button className="mobile-menu-link mobile-menu-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Overlay */}
      {menuOpen && <div className="mobile-menu-overlay" onClick={closeMenu} />}
    </nav>
  );
}
