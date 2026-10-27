import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCampaigns } from '../services/campaigns';
import type { Campaign } from '../types';
import { formatDateShort } from '../utils/formatDate';
import Layout from '../components/Layout';
import Loader from '../components/Loader';

export default function CampaignHistory() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchCampaigns = async () => {
      try {
        const data = await getCampaigns();
        setCampaigns(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  const sortedCampaigns = [...campaigns].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Layout>
      <div className="page-head">
        <div>
          <h1>Campaigns</h1>
          <p className="muted">
            {campaigns.length === 0
              ? 'Every message you send shows up here.'
              : `${campaigns.length.toLocaleString()} sent so far.`}
          </p>
        </div>
        <Link className="btn btn-primary btn-sm" to="/engage">New message</Link>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {loading && <Loader />}

      {!loading && sortedCampaigns.length === 0 && (
        <div className="empty-state">
          <p>No campaigns yet. Send your first message and it will show up here with the delivery count.</p>
        </div>
      )}

      {!loading && sortedCampaigns.length > 0 && (
        <div className="campaigns-list">
          {sortedCampaigns.map((campaign) => (
            <div className="campaign-card" key={campaign.id}>
              <div className="campaign-card-header">
                <span className="campaign-date">
                  {campaign.sent_at
                    ? formatDateShort(campaign.sent_at)
                    : formatDateShort(campaign.created_at)}
                </span>
                <span className={`pill campaign-status campaign-status--${campaign.status}`}>
                  {campaign.status}
                </span>
              </div>

              <p className="campaign-body">
                {campaign.body.length > 160
                  ? `${campaign.body.slice(0, 160)}...`
                  : campaign.body}
              </p>

              <div className="campaign-stats">
                <span className="campaign-stat">{campaign.total_recipients.toLocaleString()} sent</span>
                <span className="campaign-stat campaign-stat--success">{campaign.total_delivered.toLocaleString()} delivered</span>
                {campaign.total_failed > 0 && (
                  <span className="campaign-stat campaign-stat--fail">{campaign.total_failed.toLocaleString()} failed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
