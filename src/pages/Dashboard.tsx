import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStats } from '../services/dashboard';
import type { DashboardStats } from '../types';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { MdTextsms, MdAllInclusive, MdPeople, MdCampaign } from 'react-icons/md';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const cards = stats
    ? [
        {
          label: 'SMS This Month',
          value: (stats.sms_this_month ?? 0).toLocaleString(),
          icon: <MdTextsms />,
          color: '#3399ff',
        },
        {
          label: 'Lifetime SMS',
          value: (stats.sms_lifetime ?? 0).toLocaleString(),
          icon: <MdAllInclusive />,
          color: '#8b5cf6',
        },
        {
          label: 'Total Contacts',
          value: (stats.total_contacts ?? 0).toLocaleString(),
          icon: <MdPeople />,
          color: '#10b981',
        },
        {
          label: 'Total Campaigns',
          value: (stats.total_campaigns ?? 0).toLocaleString(),
          icon: <MdCampaign />,
          color: '#f59e0b',
        },
      ]
    : [];

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.first_name}</p>
        </div>
      </div>

      {loading && <Loader />}
      {error && <div className="alert alert--error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          {cards.map((card) => (
            <div className="stat-card" key={card.label}>
              <div
                className="stat-card-icon"
                style={{ backgroundColor: `${card.color}15`, color: card.color }}
              >
                {card.icon}
              </div>
              <div className="stat-card-info">
                <span className="stat-card-value">{card.value}</span>
                <span className="stat-card-label">{card.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
