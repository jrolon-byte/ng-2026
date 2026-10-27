import { useState, useEffect, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrgs, switchOrg } from '../services/orgs';
import type { Org } from '../services/orgs';
import ngMark from '../imgs/ng-mark.png';

interface ShellProps {
  children: ReactNode;
}

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5h16v11H8l-4 4z" />
  </svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);
const BuildingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M8 8h2M8 12h2M8 16h2M4 21h17" />
  </svg>
);

/**
 * App frame: a left sidebar on desktop (shop name, the three screens,
 * org switcher for admins, sign out) and a compact top bar plus bottom
 * tabs on phones. Every signed-in screen renders inside it.
 */
export default function Shell({ children }: ShellProps) {
  const { user, logout, setUserAndToken } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrgName, setCurrentOrgName] = useState('');

  useEffect(() => {
    if (!user) return;
    getOrgs().then((data) => {
      setOrgs(data);
      const current = data.find((o) => o.id === user.org_id);
      if (current) setCurrentOrgName(current.name);
    }).catch(() => { /* the shell still renders without the org list */ });
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === user?.org_id) return;
    try {
      const result = await switchOrg(orgId);
      setUserAndToken(result.user, result.token);
      setCurrentOrgName(result.org.name);
      navigate('/engage');
    } catch {
      alert('Failed to switch organization');
    }
  };

  const showSwitcher = orgs.length > 1;
  const link = ({ isActive }: { isActive: boolean }) => (isActive ? 'shell-link shell-link--on' : 'shell-link');
  const tab = ({ isActive }: { isActive: boolean }) => (isActive ? 'shell-tab shell-tab--on' : 'shell-tab');

  return (
    <div className="shell">
      <aside className="shell-side">
        <Link className="shell-brand" to="/engage">
          <img src={ngMark} alt="" aria-hidden="true" />
          <span>NotifyGrid</span>
        </Link>
        {currentOrgName && <div className="shell-org">{currentOrgName}</div>}

        <nav className="shell-nav" aria-label="Main">
          <NavLink to="/dashboard" className={link}><GridIcon />Dashboard</NavLink>
          <NavLink to="/engage" className={link}><ChatIcon />Engage</NavLink>
          <NavLink to="/campaigns" className={link}><ListIcon />Campaigns</NavLink>
          {showSwitcher && (
            <NavLink to="/admin/companies" className={link}><BuildingIcon />Companies</NavLink>
          )}
        </nav>

        <div className="shell-foot">
          {showSwitcher && (
            <label className="shell-switch">
              <span>Shop</span>
              <select value={user?.org_id ?? ''} onChange={(e) => handleSwitchOrg(e.target.value)}>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </label>
          )}
          {user?.first_name && <div className="shell-user">{user.first_name}</div>}
          <button type="button" className="shell-signout" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      <header className="shell-top">
        <Link className="shell-brand" to="/engage">
          <img src={ngMark} alt="" aria-hidden="true" />
        </Link>
        <div className="shell-top-org">{currentOrgName}</div>
        <button type="button" className="shell-signout" onClick={handleLogout}>Sign out</button>
      </header>

      <main className="shell-main">
        <div className="shell-content">{children}</div>
      </main>

      <nav className="shell-tabs" aria-label="Main">
        <NavLink to="/dashboard" className={tab}><GridIcon /><span>Dashboard</span></NavLink>
        <NavLink to="/engage" className={tab}><ChatIcon /><span>Engage</span></NavLink>
        <NavLink to="/campaigns" className={tab}><ListIcon /><span>Campaigns</span></NavLink>
        {showSwitcher && (
          <NavLink to="/admin/companies" className={tab}><BuildingIcon /><span>Companies</span></NavLink>
        )}
      </nav>
    </div>
  );
}
