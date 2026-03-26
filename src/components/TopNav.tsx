import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrgs, switchOrg } from '../services/orgs';
import type { Org } from '../services/orgs';
import ngLogo from '../imgs/ng.png';

export default function TopNav() {
  const { user, logout, setUserAndToken } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrgName, setCurrentOrgName] = useState('');

  useEffect(() => {
    if (!user) return;
    getOrgs().then((data) => {
      setOrgs(data);
      const current = data.find((o) => o.id === user.org_id);
      if (current) setCurrentOrgName(current.name);
    });
  }, [user]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === user?.org_id) return;
    try {
      const result = await switchOrg(orgId);
      setUserAndToken(result.user, result.token);
      setCurrentOrgName(result.org.name);
      setMenuOpen(false);
      navigate('/engage');
    } catch {
      alert('Failed to switch organization');
    }
  };

  const closeMenu = () => setMenuOpen(false);
  const showSwitcher = orgs.length > 1;

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <div className="topnav-brand">
          <img src={ngLogo} alt="NotifyGrid" style={{ height: 36 }} />
          {currentOrgName && (
            <span className="topnav-org-name">{currentOrgName}</span>
          )}
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
          {showSwitcher && (
            <select
              className="topnav-org-select"
              value={user?.org_id ?? ''}
              onChange={(e) => handleSwitchOrg(e.target.value)}
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          )}
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
        {showSwitcher && (
          <div className="mobile-menu-link" style={{ padding: '10px 0' }}>
            <select
              className="topnav-org-select topnav-org-select--mobile"
              value={user?.org_id ?? ''}
              onChange={(e) => handleSwitchOrg(e.target.value)}
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        )}
        <button className="mobile-menu-link mobile-menu-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Overlay */}
      {menuOpen && <div className="mobile-menu-overlay" onClick={closeMenu} />}
    </nav>
  );
}
