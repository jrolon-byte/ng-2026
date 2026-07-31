import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getContacts, createContact, deleteContact } from '../services/contacts';
import { sendCampaign, getCampaignStatus } from '../services/campaigns';
import { getStats } from '../services/dashboard';
import { getOrgSettings, updateOrgSettings } from '../services/orgs';
import type { Contact, DashboardStats } from '../types';
import type { OrgSettings } from '../services/orgs';
import { formatPhone } from '../utils/formatPhone';
import { formatPhoneInput } from '../utils/formatPhoneInput';
import TopNav from '../components/TopNav';
import Loader from '../components/Loader';
import UpgradePrompt from '../components/UpgradePrompt';
import PlanUsage from '../components/PlanUsage';
import { FaTrashAlt } from 'react-icons/fa';

export default function Engage() {
  const { user } = useAuth();
  const [customerList, setCustomerList] = useState<Contact[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [usage, setUsage] = useState<DashboardStats | null>(null);
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Add customer
  const [name, setName] = useState('');
  const [mobileNum, setMobileNum] = useState('');

  // Message
  const [message, setMessage] = useState('');
  const [showNoMessage, setShowNoMessage] = useState(false);
  const [sending, setSending] = useState(false);

  // Delete confirm per-customer
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Settings editor
  const [editingSettings, setEditingSettings] = useState(false);
  const [editPrefix, setEditPrefix] = useState('');
  const [editSuffix, setEditSuffix] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Upgrade sheet (paywall) open state — controlled so the locked send
  // button can trigger it without duplicating the upgrade UI.
  const [planSheetOpen, setPlanSheetOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setCustomerList([]);
    fetchCustomers();
    fetchUsage();
    fetchOrgSettings();
  }, [user?.org_id]);

  const fetchOrgSettings = async () => {
    try {
      const data = await getOrgSettings();
      setOrgSettings(data);
    } catch {
      // silent
    }
  };

  const fetchUsage = async () => {
    try {
      const data = await getStats();
      setUsage(data);
    } catch {
      // silent
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await getContacts();
      setCustomerList(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // Add customer
  const onAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobileNum.trim()) {
      alert('Please enter name and mobile number');
      return;
    }

    try {
      await createContact({
        first_name: name,
        phone: mobileNum,
      });
      setName('');
      setMobileNum('');
      setShowAddCustomer(false);
      fetchCustomers();
    } catch (err) {
      // A swallowed failure here looks identical to success (the sheet
      // closes, no new row) — the user must see WHY: duplicate, bad phone…
      alert(err instanceof Error ? err.message : 'Failed to add customer. Please try again.');
    }
  };

  // Usage helpers
  const isHardLocked = usage
    ? usage.sms_this_month + customerList.length > usage.grace_limit
    : false;
  const isFirstBlastUsed = orgSettings?.plan_status === 'first_blast'
    && usage && usage.sms_this_month > 0;

  // Character limit calculation
  const prefix = orgSettings?.message_prefix ?? '';
  const suffix = orgSettings?.message_suffix ?? '';
  const maxChars = 160 - prefix.length - suffix.length;
  const fullPreview = prefix + (message || 'Your message here...') + suffix;

  // Send message — the server QUEUES the blast and a background worker
  // delivers it (big lists take minutes; the old sync call died at ~50
  // contacts). We poll for the outcome. The idempotency key survives retries
  // of the same logical send, so a flaky network can't double-blast.
  const sendKeyRef = useRef<string | null>(null);

  const onSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ([0, 1, 2, 3, 4, 5].includes(message.length)) {
      setShowNoMessage(true);
      return;
    }
    if (isHardLocked) {
      setPlanSheetOpen(true);
      return;
    }
    setSending(true);
    try {
      if (!sendKeyRef.current) {
        sendKeyRef.current = crypto.randomUUID();
      }
      const queued = await sendCampaign({
        body: message,
        idempotency_key: sendKeyRef.current,
      });
      // Accepted — this logical send is done from the client's perspective;
      // a future send is a new key.
      sendKeyRef.current = null;
      setMessage('');
      setShowNoMessage(false);

      // Poll until the worker finishes (~2.5s cadence, up to 2 minutes).
      const deadline = Date.now() + 120_000;
      let final: Awaited<ReturnType<typeof getCampaignStatus>> | null = null;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2500));
        try {
          const status = await getCampaignStatus(queued.campaign_id);
          if (status.status !== 'queued' && status.status !== 'sending') {
            final = status;
            break;
          }
        } catch {
          // transient poll failure — keep trying until the deadline
        }
      }

      if (final && final.status === 'completed') {
        alert(`Success! Your message went out to ${final.total_delivered} customer${final.total_delivered === 1 ? '' : 's'}.`);
      } else if (final && final.status === 'failed') {
        alert('The send failed — no messages could be delivered. Please try again or contact support.');
      } else {
        alert(`Your blast to ${queued.total_recipients} customers is still sending in the background — check Campaigns for the final count.`);
      }
      fetchUsage(); // refresh usage bar
    } catch (err) {
      const serverMsg = err instanceof Error ? err.message : '';
      // If the server says we're past the allowance (stale usage data in the
      // client), open the upgrade sheet rather than dropping into a dead-end alert.
      if (serverMsg.toLowerCase().includes('upgrade') || serverMsg.toLowerCase().includes('reached everyone')) {
        sendKeyRef.current = null; // rejected, not queued — next attempt is a new send
        setPlanSheetOpen(true);
        fetchUsage();
      } else {
        // Network-level failure: keep the key so a retry of the SAME send
        // can't double-blast if the first request actually landed.
        alert(serverMsg || 'Something went wrong. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  // Delete customer
  const onDelete = async (contact: Contact) => {
    try {
      await deleteContact(contact.id);
      setConfirmDeleteId(null);
      fetchCustomers();
    } catch {
      // silent
    }
  };

  // Settings editor
  const openSettings = () => {
    setEditPrefix(orgSettings?.message_prefix ?? '');
    setEditSuffix(orgSettings?.message_suffix ?? '');
    setEditingSettings(true);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateOrgSettings({
        message_prefix: editPrefix,
        message_suffix: editSuffix,
      });
      setEditingSettings(false);
      fetchOrgSettings();
    } catch {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div>
        <TopNav />
        <div className="contain">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopNav />

      {/* Title bar */}
      <div className="contain">
        <div className="header">
          <h2>Engage</h2>
          <button
            className="btn"
            style={{ color: 'white', background: 'black' }}
            onClick={() => setShowAddCustomer(!showAddCustomer)}
          >
            {showAddCustomer ? 'Close' : 'Add New Customer'}
          </button>
        </div>
      </div>

      {/* Add Customer Form */}
      {showAddCustomer && (
        <div className="contain">
          <div>
            <h3>Add Customer</h3>
            <form className="add-form">
              <div className="form-control">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-control">
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={mobileNum}
                  onChange={(e) => setMobileNum(formatPhoneInput(e.target.value))}
                  maxLength={14}
                />
              </div>
              <button
                onClick={onAddCustomer}
                className="btn btn-block"
                style={{ color: 'white', background: 'black' }}
              >
                Add New Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Plan usage — always visible from day 1 of the cycle so users see
          their reach as it grows. First-blast trial users get UpgradePrompt
          instead; that's a different journey. */}
      {usage && !loading && !isFirstBlastUsed && (
        <div className="contain">
          <PlanUsage
            usage={usage}
            open={planSheetOpen}
            onOpenChange={setPlanSheetOpen}
          />
        </div>
      )}

      {isFirstBlastUsed && (
        <div className="contain">
          <UpgradePrompt />
        </div>
      )}

      {/* Textarea / Send */}
      <div className="contain">
        <form className="engagement-form">
          <p className="engage-tip">💡 Use <strong>@Name</strong> to personalize — each customer sees their own name</p>

          <div className="form-control">
            <textarea
              placeholder="Ey @Name, pasa por la barberia hoy! 🔥"
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= maxChars) {
                  setMessage(e.target.value);
                  // The idempotency key is bound to THIS text. Editing after
                  // a failed attempt is a new logical send — without this, a
                  // retry with the old key would return the old campaign and
                  // silently drop the edited message.
                  sendKeyRef.current = null;
                }
                if (showNoMessage) setShowNoMessage(false);
              }}
              rows={6}
              maxLength={maxChars}
            />
            <div className="engage-char-count">
              <span>{message.length} / {maxChars}</span>
            </div>
            {showNoMessage && (
              <p className="errorText">
                Do you really want to text {customerList.length} customers
                nothing? Type an engaging message to bring them through your
                door!
              </p>
            )}
          </div>

          {/* iMessage-style preview */}
          {message.length > 0 && (
            <div className="sms-preview-section">
              <div className="sms-preview-header">
                <span className="sms-preview-label">Message Preview</span>
                <button
                  type="button"
                  className="sms-preview-edit"
                  onClick={openSettings}
                >
                  Edit
                </button>
              </div>
              <div className="sms-preview">
                <div className="sms-bubble">{fullPreview}</div>
              </div>
            </div>
          )}

          {/* Inline settings editor */}
          {editingSettings && (() => {
            const maxCombined = 60;
            const combinedUsed = editPrefix.length + editSuffix.length;
            const prefixMax = maxCombined - editSuffix.length;
            const suffixMax = maxCombined - editPrefix.length;
            const messageCharsLeft = 160 - combinedUsed;

            return (
            <div className="settings-editor">
              <div className="form-control">
                <label className="settings-label">Header (before your message)</label>
                <input
                  type="text"
                  value={editPrefix}
                  onChange={(e) => {
                    if (e.target.value.length <= prefixMax) setEditPrefix(e.target.value);
                  }}
                  placeholder="YourBusiness: "
                  maxLength={prefixMax}
                />
                <div className="engage-char-count">
                  <span>{editPrefix.length} / {prefixMax}</span>
                </div>
              </div>
              <div className="form-control">
                <label className="settings-label">Footer (after your message)</label>
                <input
                  type="text"
                  value={editSuffix}
                  onChange={(e) => {
                    if (e.target.value.length <= suffixMax) setEditSuffix(e.target.value);
                  }}
                  placeholder=" -- Call Now: 407-000-0000"
                  maxLength={suffixMax}
                />
                <div className="engage-char-count">
                  <span>{editSuffix.length} / {suffixMax}</span>
                </div>
              </div>
              <p className="settings-remaining">
                {messageCharsLeft} characters left for your message
              </p>
              <div className="settings-actions">
                <button
                  type="button"
                  className="btn"
                  style={{ color: 'white', background: 'black' }}
                  onClick={saveSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ color: '#666', background: '#f4f4f4' }}
                  onClick={() => setEditingSettings(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
            );
          })()}

          {sending ? (
            <Loader />
          ) : (
            <button
              onClick={(e) => {
                if (isHardLocked) {
                  e.preventDefault();
                  setPlanSheetOpen(true);
                  return;
                }
                onSendMessage(e);
              }}
              className="btn btn-blue"
              style={{ color: 'white', background: '#3399ff' }}
              disabled={customerList.length === 0}
            >
              Send Mass Text 📲
            </button>
          )}
        </form>
      </div>

      {/* Customer List */}
      <div className="contain">
        {customerList.length > 0 ? (
          <>
            <small>{customerList.length} customers</small>
            {customerList.map((customer) => (
              <div key={customer.id}>
                {confirmDeleteId === customer.id ? (
                  // Confirm delete
                  <div className="customer confirmDelete">
                    <h3>
                      Are you sure you want to remove {customer.first_name}
                      {' as a client?'}
                    </h3>
                    <div className="btnOptions">
                      <button
                        className="btn"
                        style={{ color: 'white', background: 'black' }}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </button>
                      <button
                        className="btn"
                        style={{ color: 'white', background: 'red' }}
                        onClick={() => onDelete(customer)}
                      >
                        Yes
                      </button>
                    </div>
                    {customer.created_at && (
                      <small className="floatRight">
                        Member since:&nbsp;
                        {new Date(customer.created_at).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                ) : (
                  // Normal customer card
                  <div className="customer">
                    <h3>
                      {customer.first_name}
                      <FaTrashAlt
                        onClick={() => setConfirmDeleteId(customer.id)}
                        style={{ color: 'red', cursor: 'pointer' }}
                      />
                    </h3>
                    <p>{formatPhone(customer.phone)}</p>
                    {customer.created_at && (
                      <small className="floatRight">
                        Member since:&nbsp;
                        {new Date(customer.created_at).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <p>Add a customer to see them here.</p>
        )}
      </div>
    </div>
  );
}
