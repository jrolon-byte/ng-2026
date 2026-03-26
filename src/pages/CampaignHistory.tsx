import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCampaigns } from '../services/campaigns';
import type { Campaign } from '../types';
import { formatDateShort } from '../utils/formatDate';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { MdCheckCircle, MdCancel, MdScheduleSend } from 'react-icons/md';

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
      <div className="page-header">
        <div>
          <h1>Campaigns</h1>
          <p>{campaigns.length} total campaigns</p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {loading && <Loader />}

      {!loading && sortedCampaigns.length === 0 && (
        <div className="empty-state">
          <p>No campaigns yet. Send your first message to get started.</p>
        </div>
      )}

      {!loading && sortedCampaigns.length > 0 && (
        <div className="campaigns-list">
          {sortedCampaigns.map((campaign) => (
            <div className="campaign-card" key={campaign.id}>
              <div className="campaign-card-header">
                <div className="campaign-date">
                  <MdScheduleSend />
                  <span>
                    {campaign.sent_at
                      ? formatDateShort(campaign.sent_at)
                      : formatDateShort(campaign.created_at)}
                  </span>
                </div>
                <span
                  className={`campaign-status campaign-status--${campaign.status}`}
                >
                  {campaign.status}
                </span>
              </div>

              <p className="campaign-body">
                {campaign.body.length > 140
                  ? `${campaign.body.slice(0, 140)}...`
                  : campaign.body}
              </p>

              <div className="campaign-stats">
                <div className="campaign-stat">
                  <MdScheduleSend />
                  <span>{campaign.total_recipients} sent</span>
                </div>
                <div className="campaign-stat campaign-stat--success">
                  <MdCheckCircle />
                  <span>{campaign.total_delivered} delivered</span>
                </div>
                <div className="campaign-stat campaign-stat--fail">
                  <MdCancel />
                  <span>{campaign.total_failed} failed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
