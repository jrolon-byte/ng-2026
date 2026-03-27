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
  }, [user?.org_id]);

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

  const admin = stats?.admin;

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

      {/* Super Admin — Cost Estimator */}
      {admin && (
        <div className="admin-section">
          <h2>Cost Estimator</h2>
          <p className="admin-subtitle">All organizations combined</p>

          <div className="admin-grid">
            <div className="admin-card">
              <span className="admin-card-value">${admin.cost_this_month.toFixed(2)}</span>
              <span className="admin-card-label">Estimated cost this month</span>
              <span className="admin-card-detail">
                {admin.global_sms_this_month.toLocaleString()} texts × $0.011 + ${admin.phone_monthly} phone
              </span>
            </div>

            <div className="admin-card">
              <span className="admin-card-value">${admin.cost_lifetime.toFixed(2)}</span>
              <span className="admin-card-label">Estimated cost lifetime</span>
              <span className="admin-card-detail">
                {admin.global_sms_lifetime.toLocaleString()} texts × $0.011
              </span>
            </div>

            <div className="admin-card">
              <span className="admin-card-value">{admin.global_sms_this_month.toLocaleString()}</span>
              <span className="admin-card-label">Total texts this month (all clients)</span>
            </div>

            <div className="admin-card">
              <span className="admin-card-value">{admin.total_orgs}</span>
              <span className="admin-card-label">Active organizations</span>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
