import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getContacts,
  createContact,
  deleteContact,
  updateContact,
  getContactMessages,
} from '../services/contacts';
import type { ContactThread } from '../services/contacts';
import { sendCampaign, getCampaignStatus } from '../services/campaigns';
import { getStats } from '../services/dashboard';
import { getOrgSettings, updateOrgSettings } from '../services/orgs';
import type { Contact, DashboardStats } from '../types';
import { isUndeliverable } from '../types';
import type { OrgSettings } from '../services/orgs';
import { formatPhone } from '../utils/formatPhone';
import { formatPhoneInput } from '../utils/formatPhoneInput';
import { getEngageCopy } from '../i18n/engage';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import UpgradePrompt from '../components/UpgradePrompt';
import PlanUsage from '../components/PlanUsage';

// GSM-7 basic set plus the common extension characters. Anything outside it
// (emoji, curly quotes, long dashes) makes carriers send the whole message as
// 70-character UCS-2 segments instead of 160, so the "texts per person" tile
// tells the truth before the money is spent.
const GSM7 = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/;
function segmentsFor(text: string): number {
  if (text.length === 0) return 1;
  const per = GSM7.test(text) ? 160 : 70;
  return Math.max(1, Math.ceil(text.length / per));
}

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
  </svg>
);

export default function Engage() {
  const { user } = useAuth();
  // ?welcome=1 is set once by the pay-first signup flow; dismissing it
  // strips the param so a refresh doesn't bring the banner back.
  const [searchParams, setSearchParams] = useSearchParams();
  const showWelcome = searchParams.get('welcome') === '1';
  const [customerList, setCustomerList] = useState<Contact[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [usage, setUsage] = useState<DashboardStats | null>(null);
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Add customer
  const [name, setName] = useState('');
  const [mobileNum, setMobileNum] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Message
  const [message, setMessage] = useState('');
  const [showNoMessage, setShowNoMessage] = useState(false);
  const [sending, setSending] = useState(false);

  // List filter — client-side only, and never applied to the send audience:
  // narrowing what you SEE must not narrow who a blast reaches.
  const [searchText, setSearchText] = useState('');

  // Dead-number section, collapsed by default (a cleanup task, not a destination).
  const [showUnreachable, setShowUnreachable] = useState(false);

  // Delete confirm per-customer
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Contact detail overlay (conversation + edit)
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [detailError, setDetailError] = useState<string | null>(null);
  const [savingContact, setSavingContact] = useState(false);
  const [thread, setThread] = useState<ContactThread | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);

  // Settings editor
  const [editingSettings, setEditingSettings] = useState(false);
  const [editPrefix, setEditPrefix] = useState('');
  const [editSuffix, setEditSuffix] = useState('');
  const [editLocale, setEditLocale] = useState<'en' | 'es'>('en');
  const [savingSettings, setSavingSettings] = useState(false);

  // Upgrade sheet (paywall) open state — controlled so the locked send
  // button can trigger it without duplicating the upgrade UI.
  const [planSheetOpen, setPlanSheetOpen] = useState(false);

  const copy = getEngageCopy(orgSettings?.locale);

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

  // ── Audience math ──
  // Mirrors the iOS SendViewModel exactly: the list splits into reachable
  // and dead, and the SEND count is opted-in AND deliverable. Counting the
  // whole list overstated reach on this page for years.
  const unreachable = customerList.filter(isUndeliverable);
  const reachable = customerList.filter((c) => !isUndeliverable(c));
  const sendable = reachable.filter((c) => c.opted_in);
  const optedOutCount = reachable.length - reachable.filter((c) => c.opted_in).length;
  const replyCount = reachable.reduce((n, c) => n + (c.unread_replies > 0 ? 1 : 0), 0);

  // Name matching is case-insensitive; number matching compares digits only,
  // so "555-01" and "(407) 555" both hit the stored E.164 form.
  const matchesSearch = (c: Contact) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    const fullName = `${c.first_name} ${c.last_name ?? ''}`.toLowerCase();
    if (fullName.includes(q)) return true;
    const digits = q.replace(/\D/g, '');
    return digits.length > 0 && c.phone.replace(/\D/g, '').includes(digits);
  };
  const visibleReachable = reachable.filter(matchesSearch);
  const visibleUnreachable = unreachable.filter(matchesSearch);

  // Usage helpers
  const isHardLocked = usage
    ? usage.sms_this_month + sendable.length > usage.grace_limit
    : false;
  const isFirstBlastUsed = orgSettings?.plan_status === 'first_blast'
    && usage && usage.sms_this_month > 0;
  const leftThisMonth = usage ? Math.max(0, usage.grace_limit - usage.sms_this_month) : null;

  // Character limit calculation
  const prefix = orgSettings?.message_prefix ?? '';
  const suffix = orgSettings?.message_suffix ?? '';
  const maxChars = 160 - prefix.length - suffix.length;
  const fullPreview = prefix + (message || 'Your message here...') + suffix;
  // Carrier segments are shown for honesty about delivery, but the plan
  // allowance deducts ONE per contact per send regardless of segments
  // (see campaign-send + dashboard-stats). The cost line and the warning
  // must follow the plan's math, not the carrier's.
  const segments = segmentsFor(prefix + message + suffix);
  const sendCost = sendable.length;
  const overBudget = leftThisMonth !== null && sendCost > leftThisMonth;

  // The "To" line: a few real names, then the rest as a count. A list is a
  // room full of regulars, not a number.
  const namePreview = sendable.slice(0, 3).map((c) => c.first_name).join(', ');
  const remaining = sendable.length - Math.min(3, sendable.length);

  const today = new Date().toLocaleDateString(orgSettings?.locale === 'es' ? 'es' : undefined, {
    weekday: 'long', hour: 'numeric', minute: '2-digit',
  });

  // Add customer
  const onAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobileNum.trim()) {
      setAddError(copy.nameAndPhoneRequired);
      return;
    }
    try {
      await createContact({
        first_name: name,
        phone: mobileNum,
      });
      setName('');
      setMobileNum('');
      setAddError(null);
      setShowAddCustomer(false);
      fetchCustomers();
    } catch (err) {
      // The failure surfaces IN the form (not an alert): duplicate numbers
      // were the common case and an alert read as the app breaking.
      const msg = err instanceof Error ? err.message : '';
      setAddError(
        msg.toLowerCase().includes('already exists') ? copy.phoneAlreadyExists
          : msg || 'Failed to add customer. Please try again.'
      );
    }
  };

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
        alert(copy.sendSuccess(final.total_delivered));
      } else if (final && final.status === 'failed') {
        alert(copy.sendFailed);
      } else {
        alert(copy.sendStillRunning(queued.total_recipients));
      }
      fetchUsage(); // refresh usage
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
      if (detailContact?.id === contact.id) closeDetail();
      fetchCustomers();
    } catch {
      // silent
    }
  };

  // ── Contact detail (conversation + edit) ──
  const openDetail = (contact: Contact, startEditing = false) => {
    setDetailContact(contact);
    setDetailEditing(startEditing);
    setEditName(contact.first_name);
    setEditPhone(formatPhoneInput(contact.phone));
    setEditEmail(contact.email ?? '');
    setDetailError(null);
    setThread(null);
    setThreadLoading(true);
    // Opening the thread reads it: mark_read clears the badge server-side,
    // and the local row updates so the badge dies without a refetch.
    const hadUnread = contact.unread_replies > 0;
    getContactMessages(contact.id, hadUnread)
      .then((t) => {
        setThread(t);
        if (hadUnread) {
          setCustomerList((list) =>
            list.map((c) => (c.id === contact.id ? { ...c, unread_replies: 0 } : c))
          );
        }
      })
      .catch(() => setThread({ messages: [], omitted_count: 0 }))
      .finally(() => setThreadLoading(false));
  };

  const closeDetail = () => {
    setDetailContact(null);
    setDetailEditing(false);
    setDetailError(null);
    setThread(null);
  };

  const onSaveContact = async () => {
    if (!detailContact) return;
    setSavingContact(true);
    setDetailError(null);
    try {
      await updateContact({
        contact_id: detailContact.id,
        first_name: editName.trim(),
        phone: editPhone,
        email: editEmail.trim() || undefined,
      });
      closeDetail();
      fetchCustomers();
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : copy.couldntSave);
    } finally {
      setSavingContact(false);
    }
  };

  // Settings editor
  const openSettings = () => {
    setEditPrefix(orgSettings?.message_prefix ?? '');
    setEditSuffix(orgSettings?.message_suffix ?? '');
    setEditLocale(orgSettings?.locale === 'es' ? 'es' : 'en');
    setEditingSettings(true);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateOrgSettings({
        message_prefix: editPrefix,
        message_suffix: editSuffix,
        locale: editLocale,
      });
      setEditingSettings(false);
      fetchOrgSettings();
    } catch {
      alert(copy.failedToSave);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loader />
      </Layout>
    );
  }

  const renderCustomerRow = (customer: Contact) => {
    const dead = isUndeliverable(customer);
    const hasReply = customer.unread_replies > 0;

    if (confirmDeleteId === customer.id) {
      return (
        <div className="customer confirmDelete">
          <h3>{copy.removeConfirm(customer.first_name)}</h3>
          <div className="btnOptions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteId(null)}>
              {copy.no}
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(customer)}>
              {copy.yes}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`customer customer--clickable${hasReply ? ' customer--reply' : ''}${dead ? ' customer--dead' : ''}`}
        onClick={() => openDetail(customer)}
      >
        <span className="customer-name">
          {customer.first_name}
          {hasReply && <span className="reply-badge">{copy.newBadge(customer.unread_replies)}</span>}
          {!dead && !customer.opted_in && <span className="optout-badge">{copy.optedOut}</span>}
        </span>
        <span className="customer-phone">
          {formatPhone(customer.phone)}
          {dead && <span className="dead-note"> · {copy.lastTextsNeverArrived(customer.consecutive_failures)}</span>}
        </span>
        <span className="customer-since">
          {customer.created_at ? `${copy.memberSince} ${new Date(customer.created_at).toLocaleDateString()}` : ''}
        </span>
        {dead ? (
          <button
            type="button"
            className="fix-number-btn"
            onClick={(e) => {
              e.stopPropagation();
              openDetail(customer, true);
            }}
          >
            {copy.fixNumber}
          </button>
        ) : (
          <button
            type="button"
            className="customer-remove"
            aria-label={copy.remove}
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDeleteId(customer.id);
            }}
          >
            <TrashIcon />
          </button>
        )}
      </div>
    );
  };

  return (
    <Layout>
      {showWelcome && (
        <div className="ng-welcome-banner" role="status">
          <div>
            <strong>{copy.welcomeTitle}</strong>
            <p>{copy.welcomeBody}</p>
          </div>
          <button
            type="button"
            className="ng-welcome-dismiss"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('welcome');
              setSearchParams(next, { replace: true });
            }}
          >
            {copy.welcomeDismiss}
          </button>
        </div>
      )}

      <div className="page-head">
        <h1>{copy.newMessage}</h1>
        <span className="when">{today}</span>
      </div>

      {/* Plan usage — always visible from day 1 of the cycle so users see
          their reach as it grows. First-blast trial users get UpgradePrompt
          instead; that's a different journey. */}
      {usage && !isFirstBlastUsed && (
        <PlanUsage usage={usage} open={planSheetOpen} onOpenChange={setPlanSheetOpen} />
      )}
      {isFirstBlastUsed && <UpgradePrompt />}

      {/* Composer */}
      <form
        className="card compose engagement-form"
        onSubmit={(e) => {
          if (isHardLocked) {
            e.preventDefault();
            setPlanSheetOpen(true);
            return;
          }
          onSendMessage(e);
        }}
      >
        <div className="field">
          <span className="field-label">{copy.toLabel}</span>
          <div className="to-row">
            {sendable.length > 0 ? (
              <span className="to-names">
                {namePreview}
                {remaining > 0 && <span className="muted"> {copy.andMore(remaining)}</span>}
              </span>
            ) : (
              <span className="to-names is-empty">{copy.everyone}</span>
            )}
            <span className="pill">{copy.people(sendable.length)}</span>
            {replyCount > 0 && <span className="pill pill--reply">{copy.newReplies(replyCount)}</span>}
            {optedOutCount > 0 && <span className="pill">{copy.optedOutCount(optedOutCount)}</span>}
            {unreachable.length > 0 && <span className="pill pill--warn">{copy.unreachableHeader(unreachable.length)}</span>}
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="ng-message">{copy.messageLabel}</label>
          <textarea
            id="ng-message"
            placeholder={copy.composePlaceholder}
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
            rows={4}
            maxLength={maxChars}
          />
          <p className="engage-tip">{copy.personalizeTip}</p>
          {showNoMessage && (
            <p className="errorText">{copy.emptyMessageWarning(sendable.length)}</p>
          )}
        </div>

        {/* The message as the customer's phone will show it: header, body, footer */}
        {message.length > 0 && (
          <div className="preview">
            <div className="preview-head">
              <span className="preview-label">{copy.messagePreview}</span>
              <button type="button" className="sms-preview-edit" onClick={openSettings}>
                {copy.edit}
              </button>
            </div>
            <div className="sms-preview">
              <div className="sms-bubble">{fullPreview}</div>
            </div>
          </div>
        )}

        {/* Inline settings editor */}
        {editingSettings && (() => {
          const maxCombined = 50; // keep in step with MAX_WRAPPER in org-settings-update.ts
          const combinedUsed = editPrefix.length + editSuffix.length;
          const prefixMax = maxCombined - editSuffix.length;
          const suffixMax = maxCombined - editPrefix.length;
          const messageCharsLeft = 160 - combinedUsed;

          return (
            <div className="settings-editor">
              <div className="form-control">
                <label className="settings-label">{copy.headerLabel}</label>
                <input
                  type="text"
                  value={editPrefix}
                  onChange={(e) => {
                    if (e.target.value.length <= prefixMax) setEditPrefix(e.target.value);
                  }}
                  placeholder={copy.headerPlaceholder}
                  maxLength={prefixMax}
                />
                <div className="engage-char-count">
                  <span>{editPrefix.length} / {prefixMax}</span>
                </div>
              </div>
              <div className="form-control">
                <label className="settings-label">{copy.footerLabel}</label>
                <input
                  type="text"
                  value={editSuffix}
                  onChange={(e) => {
                    if (e.target.value.length <= suffixMax) setEditSuffix(e.target.value);
                  }}
                  placeholder={copy.footerPlaceholder}
                  maxLength={suffixMax}
                />
                <div className="engage-char-count">
                  <span>{editSuffix.length} / {suffixMax}</span>
                </div>
              </div>
              <p className="settings-remaining">
                {copy.charactersLeftForMessage(messageCharsLeft)}
              </p>
              <div className="form-control">
                <label className="settings-label">{copy.language}</label>
                <div className="locale-toggle">
                  <button
                    type="button"
                    className={`locale-option${editLocale === 'en' ? ' locale-option--active' : ''}`}
                    onClick={() => setEditLocale('en')}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`locale-option${editLocale === 'es' ? ' locale-option--active' : ''}`}
                    onClick={() => setEditLocale('es')}
                  >
                    Español
                  </button>
                </div>
                <p className="settings-remaining">{copy.languageNote}</p>
              </div>
              <div className="settings-actions">
                <button type="button" className="btn btn-sm" onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings ? copy.saving : copy.save}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingSettings(false)}>
                  {copy.cancel}
                </button>
              </div>
            </div>
          );
        })()}

        <div className="tiles">
          <div className="tile">
            <div className="tile-label">{copy.charactersLabel}</div>
            <div className="tile-value">{message.length}<small>/ {maxChars}</small></div>
          </div>
          <div className="tile" title={segments > 1 ? copy.segmentHint : undefined}>
            <div className="tile-label">{copy.textsPerPerson}</div>
            <div className="tile-value">{segments}</div>
            {segments > 1 && <div className="tile-hint">{copy.segmentHint}</div>}
          </div>
          <div className={`tile${overBudget ? ' tile--warn' : ''}`}>
            <div className="tile-label">{copy.leftThisMonth}</div>
            <div className="tile-value">{leftThisMonth === null ? '—' : leftThisMonth.toLocaleString()}</div>
          </div>
        </div>

        <div className="compose-actions">
          <span className="note">
            {sendable.length === 0 ? copy.nobodyYet : copy.fromPlan(sendCost)}
          </span>
          <button type="button" className="btn btn-quiet" disabled title={copy.scheduleSoon}>
            {copy.schedule}
          </button>
          {sending ? (
            <Loader />
          ) : (
            <button type="submit" className="btn btn-primary" disabled={sendable.length === 0}>
              {copy.sendTo(sendable.length)}
            </button>
          )}
        </div>
      </form>

      {/* Customers */}
      <div className="section-title">
        <h2>
          {copy.customersTitle(reachable.length)}
          {optedOutCount > 0 && <span className="count">{copy.optedOutCount(optedOutCount)}</span>}
        </h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setAddError(null);
            setShowAddCustomer(!showAddCustomer);
          }}
        >
          {showAddCustomer ? copy.close : copy.addCustomerShort}
        </button>
      </div>

      {showAddCustomer && (
        <form className="card add-form" onSubmit={onAddCustomer}>
          <div className="form-control">
            <label htmlFor="ng-new-name">{copy.customerName}</label>
            <input
              id="ng-new-name"
              type="text"
              placeholder={copy.customerName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-control">
            <label htmlFor="ng-new-phone">{copy.mobileNumber}</label>
            <input
              id="ng-new-phone"
              type="tel"
              placeholder="(407) 555-0134"
              value={mobileNum}
              onChange={(e) => setMobileNum(formatPhoneInput(e.target.value))}
              maxLength={14}
            />
          </div>
          {addError && <p className="errorText">{addError}</p>}
          <div className="settings-actions">
            <button type="submit" className="btn btn-primary">{copy.addCustomerCta}</button>
          </div>
        </form>
      )}

      {reachable.length > 0 ? (
        <>
          <div className="customer-search">
            <input
              type="search"
              placeholder={copy.searchPlaceholder}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          {visibleReachable.length === 0 ? (
            <p className="no-matches">{copy.noSearchMatches}</p>
          ) : (
            <div className="list">
              {visibleReachable.map((customer) => (
                <div key={customer.id}>{renderCustomerRow(customer)}</div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="empty-state"><p>{copy.emptyList}</p></div>
      )}

      {/* Dead numbers — separated from the working list: these aren't
          customers you can reach, they're a cleanup job. */}
      {unreachable.length > 0 && (
        <div className="unreachable-section">
          <button
            type="button"
            className="unreachable-header"
            onClick={() => setShowUnreachable(!showUnreachable)}
          >
            <span>{copy.unreachableHeader(unreachable.length)}</span>
            <span className={`unreachable-chevron${showUnreachable ? ' unreachable-chevron--open' : ''}`}>›</span>
          </button>
          {showUnreachable && (
            <div className="unreachable-body">
              <p className="unreachable-explainer">{copy.unreachableExplainer}</p>
              {visibleUnreachable.map((customer) => (
                <div key={customer.id}>{renderCustomerRow(customer)}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact detail overlay: the conversation, plus editing */}
      {detailContact && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal contact-detail" onClick={(e) => e.stopPropagation()}>
            {detailEditing ? (
              <>
                <h3 className="modal-title">{copy.editCustomer}</h3>
                <div className="form-control">
                  <label className="settings-label">{copy.customerName}</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="settings-label">{copy.mobileNumber}</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(formatPhoneInput(e.target.value))}
                    maxLength={14}
                    autoFocus={isUndeliverable(detailContact)}
                  />
                </div>
                <div className="form-control">
                  <label className="settings-label">{copy.emailOptional}</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                {detailError && <p className="errorText">{detailError}</p>}
                <div className="settings-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={onSaveContact} disabled={savingContact}>
                    {savingContact ? copy.saving : copy.saveChanges}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetailEditing(false)}>
                    {copy.cancel}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="contact-detail-header">
                  <div>
                    <h3 className="modal-title">{detailContact.first_name}</h3>
                    <p className="contact-detail-phone">{formatPhone(detailContact.phone)}</p>
                    {!detailContact.opted_in && (
                      <span className="optout-badge">{copy.optedOut}</span>
                    )}
                  </div>
                  <button type="button" className="sms-preview-edit" onClick={() => setDetailEditing(true)}>
                    {copy.edit}
                  </button>
                </div>

                <p className="settings-label conversation-label">{copy.conversation}</p>
                {threadLoading ? (
                  <p className="conversation-loading">{copy.loadingConversation}</p>
                ) : thread && thread.messages.length > 0 ? (
                  <div className="thread">
                    {thread.omitted_count > 0 && (
                      <p className="thread-omitted">{copy.earlierHidden(thread.omitted_count)}</p>
                    )}
                    {thread.messages.map((m) => (
                      <div key={m.id} className={`thread-row thread-row--${m.direction}`}>
                        <div className={`thread-bubble thread-bubble--${m.direction}`}>{m.body}</div>
                        {m.created_at && (
                          <small className="thread-time">
                            {new Date(m.created_at).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="conversation-loading">
                    {copy.nothingYet(detailContact.first_name)}
                  </p>
                )}

                <div className="settings-actions">
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(detailContact)}>
                    {copy.remove}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={closeDetail}>
                    {copy.close}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
