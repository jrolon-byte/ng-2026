import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import type { DashboardStats } from '../types';

interface PlanUsageProps {
  usage: DashboardStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ChipState = 'soft' | 'near' | 'over';

const PLAN_NAME_BY_LIMIT: Record<number, string> = {
  100: 'First Blast',
  600: 'Starter',
  1500: 'Pro',
  4000: 'Enterprise',
};

interface PlanDetail {
  key: 'pro' | 'enterprise';
  name: string;
  price: string;
  priceUnit: string;
  textLimit: number;
  tagline: string;
  features: string[];
}

const PLAN_DETAILS: Record<'pro' | 'enterprise', PlanDetail> = {
  pro: {
    key: 'pro',
    name: 'Pro',
    price: '$49',
    priceUnit: '/mo',
    textLimit: 1500,
    tagline: 'Reach everyone, every week',
    features: ['1,500 sends per month', 'Delivery reports', 'Unlimited customers'],
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    price: '$149',
    priceUnit: '/mo',
    textLimit: 4000,
    tagline: 'For when you\'re doing it big',
    features: ['4,000 sends per month', 'Priority support', 'Unlimited customers'],
  },
};

function getUpgradeOptions(currentLimit: number): PlanDetail[] {
  if (currentLimit >= 4000) return [];
  if (currentLimit >= 1500) return [PLAN_DETAILS.enterprise];
  return [PLAN_DETAILS.pro, PLAN_DETAILS.enterprise];
}

function getChipState(sent: number, cap: number, grace: number): ChipState {
  if (sent >= grace) return 'over';
  if (sent >= cap) return 'near';
  return 'soft';
}

export default function PlanUsage({ usage, open, onOpenChange }: PlanUsageProps) {
  const { token } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const sent = usage.sms_this_month;
  const cap = usage.text_limit;
  const bonus = usage.grace_limit - usage.text_limit;
  const total = usage.grace_limit;
  const left = Math.max(0, total - sent);
  const contacts = usage.total_contacts;
  const state = getChipState(sent, cap, total);
  const currentPlanName = PLAN_NAME_BY_LIMIT[cap] ?? 'your plan';
  const upgradeOptions = getUpgradeOptions(cap);
  const primaryUpgrade = upgradeOptions[0];

  const resetLabel = new Date(usage.reset_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
  const resetShort = new Date(usage.reset_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Force-open at 'over' so the user isn't stuck in a silent dead-end.
  // Never auto-open at 'near' — respect agency, let them choose.
  useEffect(() => {
    if (state === 'over' && upgradeOptions.length > 0) onOpenChange(true);
  }, [state, upgradeOptions.length, onOpenChange]);

  const handleUpgrade = async (planKey: 'pro' | 'enterprise') => {
    setLoadingPlan(planKey);
    try {
      const res = await fetch(`${BASE_URL}/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'upgrade', plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      window.location.href = data.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingPlan(null);
    }
  };

  // ── Chip copy per state (our voice)
  const chipTitle = {
    soft: `${sent.toLocaleString()} of ${total.toLocaleString()} sent this cycle`,
    near: `You're in your growth bonus 🌱`,
    over: `You've reached everyone this cycle 🎉`,
  }[state];

  const chipSub = {
    soft: `${currentPlanName} plan · resets ${resetShort}`,
    near: `${left.toLocaleString()} text${left === 1 ? '' : 's'} left on us · resets ${resetShort}`,
    over: `Everything refreshes ${resetShort}`,
  }[state];

  const canDismiss = state !== 'over';
  const canUpgrade = upgradeOptions.length > 0;

  // Sheet content bits (only rendered when primaryUpgrade exists)
  const sheetHeadline = state === 'over'
    ? "You've reached everyone this cycle."
    : 'Your reach is outgrowing your plan.';

  const sheetSub = state === 'over'
    ? `You've sent ${sent.toLocaleString()} messages to your ${contacts} customers — your full ${currentPlanName} plan plus every bonus text we added (2 per customer, on us). Let's give you more room to keep showing up.`
    : `You've sent ${sent.toLocaleString()} messages this cycle — past your ${currentPlanName} plan (${cap.toLocaleString()}) and into the ${bonus.toLocaleString()} texts we added for you. Upgrading gives you real room to breathe.`;

  return (
    <>
      <ChipView
        state={state}
        title={chipTitle}
        sub={chipSub}
        sent={sent}
        cap={cap}
        total={total}
        canUpgrade={canUpgrade}
        onOpen={() => onOpenChange(true)}
      />

      {open && primaryUpgrade && createPortal(
        <SheetView
          state={state}
          sent={sent}
          cap={cap}
          currentPlanName={currentPlanName}
          contacts={contacts}
          resetLabel={resetLabel}
          primaryUpgrade={primaryUpgrade}
          upgradeOptions={upgradeOptions}
          headline={sheetHeadline}
          sub={sheetSub}
          loadingPlan={loadingPlan}
          canDismiss={canDismiss}
          onDismiss={() => canDismiss && onOpenChange(false)}
          onUpgrade={handleUpgrade}
        />,
        document.body,
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
//  Chip
// ══════════════════════════════════════════════════════════════

interface ChipViewProps {
  state: ChipState;
  title: string;
  sub: string;
  sent: number;
  cap: number;
  total: number;
  canUpgrade: boolean;
  onOpen: () => void;
}

function ChipView({ state, title, sub, sent, cap, total, canUpgrade, onOpen }: ChipViewProps) {
  return (
    <div className={`plan-chip plan-chip--${state}`}>
      <div className="plan-chip-body">
        <div className="plan-chip-title">{title}</div>
        <ProgressBar sent={sent} cap={cap} total={total} state={state} />
        <div className="plan-chip-sub">{sub}</div>
      </div>
      {state !== 'over' && canUpgrade && (
        <button
          type="button"
          className="plan-chip-cta"
          onClick={onOpen}
        >
          View options
        </button>
      )}
    </div>
  );
}

interface ProgressBarProps {
  sent: number;
  cap: number;
  total: number;
  state: ChipState;
}

function ProgressBar({ sent, cap, total, state }: ProgressBarProps) {
  const pct = Math.min(100, (sent / total) * 100);
  const capPct = (cap / total) * 100;
  const inBonusPct = pct > capPct ? ((pct - capPct) / pct) * 100 : 0;

  return (
    <div className={`plan-progress plan-progress--${state}`}>
      <div className="plan-progress-track">
        <div
          className="plan-progress-fill"
          style={{
            width: `${pct}%`,
            background: pct <= capPct
              ? 'var(--plan-blue)'
              : `linear-gradient(90deg, var(--plan-blue) 0%, var(--plan-blue) ${100 - inBonusPct}%, var(--plan-green) ${100 - inBonusPct}%, var(--plan-green) 100%)`,
          }}
        />
        <div
          className="plan-progress-marker"
          style={{ left: `${capPct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Sheet
// ══════════════════════════════════════════════════════════════

interface SheetViewProps {
  state: ChipState;
  sent: number;
  cap: number;
  currentPlanName: string;
  contacts: number;
  resetLabel: string;
  primaryUpgrade: PlanDetail;
  upgradeOptions: PlanDetail[];
  headline: string;
  sub: string;
  loadingPlan: string | null;
  canDismiss: boolean;
  onDismiss: () => void;
  onUpgrade: (plan: 'pro' | 'enterprise') => void;
}

function SheetView({
  state,
  sent,
  cap,
  currentPlanName,
  contacts,
  resetLabel,
  primaryUpgrade,
  upgradeOptions,
  headline,
  sub,
  loadingPlan,
  canDismiss,
  onDismiss,
  onUpgrade,
}: SheetViewProps) {
  const multiplier = cap > 0 ? (primaryUpgrade.textLimit / cap).toFixed(primaryUpgrade.textLimit / cap % 1 === 0 ? 0 : 1) : '—';
  const timesReach = contacts > 0 ? Math.floor(primaryUpgrade.textLimit / contacts) : 0;
  const impactNextPct = Math.min(100, (primaryUpgrade.textLimit / primaryUpgrade.textLimit) * 100);
  const impactCurrentPct = (cap / primaryUpgrade.textLimit) * 100;

  return (
    <div className="plan-sheet-portal" role="dialog" aria-modal="true">
      <div
        className="plan-sheet-backdrop"
        onClick={onDismiss}
      />
      <div className="plan-sheet">
        <div className="plan-sheet-grabber" aria-hidden />

        <div className="plan-sheet-scroll">
          {canDismiss && (
            <button
              type="button"
              className="plan-sheet-dismiss"
              onClick={onDismiss}
            >
              Maybe later
            </button>
          )}

          <div className="plan-sheet-emoji" aria-hidden>
            {state === 'over' ? '🎉' : '🌱'}
          </div>

          <h2 className="plan-sheet-headline">{headline}</h2>
          <p className="plan-sheet-sub">{sub}</p>

          {/* Impact card */}
          <div className="plan-impact">
            <div className="plan-impact-grid">
              <div>
                <div className="plan-impact-label">Your reach today</div>
                <div className="plan-impact-value">{sent.toLocaleString()}</div>
              </div>
              <div>
                <div className="plan-impact-label">With {primaryUpgrade.name}</div>
                <div className="plan-impact-value plan-impact-value--blue">
                  {primaryUpgrade.textLimit.toLocaleString()}
                  <span className="plan-impact-unit">{primaryUpgrade.priceUnit}</span>
                </div>
              </div>
            </div>
            <div className="plan-impact-scale">
              <div className="plan-impact-scale-labels">
                <span>{currentPlanName} · {cap.toLocaleString()}</span>
                <span>{primaryUpgrade.name} · {primaryUpgrade.textLimit.toLocaleString()}</span>
              </div>
              <div className="plan-impact-scale-track">
                <div
                  className="plan-impact-scale-current"
                  style={{ width: `${impactCurrentPct}%` }}
                />
                <div
                  className="plan-impact-scale-next"
                  style={{ width: `${impactNextPct}%` }}
                />
              </div>
              <div className="plan-impact-note">
                That's <strong>{multiplier}×</strong> your reach — enough to text every one of your {contacts} customers <strong>{timesReach} {timesReach === 1 ? 'time' : 'times'}</strong> before everything refreshes {resetLabel}.
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="plan-cards">
            {upgradeOptions.map((plan, idx) => {
              const isHero = idx === 0;
              const isLoading = loadingPlan === plan.key;
              return (
                <div
                  key={plan.key}
                  className={`plan-card ${isHero ? 'plan-card--hero' : ''}`}
                >
                  {isHero && <div className="plan-card-badge">RECOMMENDED</div>}
                  <div className="plan-card-head">
                    <span className="plan-card-name">{plan.name}</span>
                    <span className="plan-card-price">
                      {plan.price}<span className="plan-card-unit">{plan.priceUnit}</span>
                    </span>
                  </div>
                  <div className="plan-card-texts">{plan.textLimit.toLocaleString()} texts/month</div>
                  <div className="plan-card-tagline">{plan.tagline}</div>
                  <ul className="plan-card-features">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="plan-card-cta"
                    onClick={() => onUpgrade(plan.key)}
                    disabled={loadingPlan !== null}
                  >
                    {isLoading ? 'Redirecting…' : `Upgrade to ${plan.name} →`}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="plan-sheet-spacer" />
        </div>

        {/* Sticky footer CTA */}
        <div className="plan-sheet-footer">
          <button
            type="button"
            className="plan-sheet-primary"
            onClick={() => onUpgrade(primaryUpgrade.key)}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === primaryUpgrade.key
              ? 'Redirecting…'
              : `Upgrade to ${primaryUpgrade.name} · ${primaryUpgrade.price}${primaryUpgrade.priceUnit} →`}
          </button>
          <div className="plan-sheet-fineprint">
            Change anytime. We'll always have your back.
          </div>
        </div>
      </div>
    </div>
  );
}
