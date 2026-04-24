import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import type { DashboardStats } from '../types';
import { getCopy, formatResetDate, type PaywallCopy } from '../i18n/paywall';

// Renders **bold** segments inside a string as <strong>. Lets our i18n
// dictionary mark emphasis without templating JSX into the strings file.
function boldify(input: string): React.ReactNode {
  const parts = input.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

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
  textLimit: number;
}

// Plan name, price, and texts/month live in code because they're tied to
// stripe-checkout.ts (PLAN_CATALOG) and must stay in sync with billing.
// Translatable text — tagline, features, CTAs — lives in i18n/paywall.ts.
const PLAN_DETAILS: Record<'pro' | 'enterprise', PlanDetail> = {
  pro:        { key: 'pro',        name: 'Pro',        price: '$49',  textLimit: 1500 },
  enterprise: { key: 'enterprise', name: 'Enterprise', price: '$149', textLimit: 4000 },
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

  const locale = usage.locale ?? 'en';
  const copy = getCopy(locale);

  const sent = usage.sms_this_month;
  const cap = usage.text_limit;
  const bonusAmount = usage.grace_limit - usage.text_limit;
  const total = usage.grace_limit;
  const left = Math.max(0, total - sent);
  const contacts = usage.total_contacts;
  const state = getChipState(sent, cap, total);
  const currentPlanName = PLAN_NAME_BY_LIMIT[cap] ?? 'your plan';
  const upgradeOptions = getUpgradeOptions(cap);
  const primaryUpgrade = upgradeOptions[0];

  const resetLabel = formatResetDate(usage.reset_date, locale, 'long');
  const resetShort = formatResetDate(usage.reset_date, locale, 'short');

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

  const chipTitle = {
    soft: copy.chip.softTitle(sent, total),
    near: copy.chip.nearTitle,
    over: copy.chip.overTitle,
  }[state];

  const chipSub = {
    soft: copy.chip.softSub(currentPlanName, resetShort),
    near: copy.chip.nearSub(left, resetShort),
    over: copy.chip.overSub(resetShort),
  }[state];

  const canDismiss = state !== 'over';
  const canUpgrade = upgradeOptions.length > 0;

  const sheetHeadline = state === 'over' ? copy.sheet.headlineOver : copy.sheet.headlineNear;
  const sheetSub = state === 'over'
    ? copy.sheet.subOver({ sent, plan: currentPlanName, contacts })
    : copy.sheet.subNear({ sent, plan: currentPlanName, cap, bonus: bonusAmount });

  return (
    <>
      {usage.bonus && <BonusBanner bonus={usage.bonus} locale={locale} copy={copy} />}

      <ChipView
        state={state}
        title={chipTitle}
        sub={chipSub}
        sent={sent}
        cap={cap}
        total={total}
        canUpgrade={canUpgrade}
        onOpen={() => onOpenChange(true)}
        cta={copy.chip.cta}
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
          copy={copy}
        />,
        document.body,
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
//  Bonus banner — shown above the chip when an active gift exists.
//  Copy comes from the DB (bonus_note) so James can personalize without
//  a code change. Auto-disappears when bonus_expires_at passes because
//  the backend stops sending the `bonus` field in that state.
// ══════════════════════════════════════════════════════════════

interface BonusBannerProps {
  bonus: { extra_texts: number; expires_at: string; note: string };
  locale: string;
  copy: PaywallCopy;
}

function BonusBanner({ bonus, locale, copy }: BonusBannerProps) {
  const until = formatResetDate(bonus.expires_at, locale, 'long');
  return (
    <div className="plan-gift" role="note">
      <span className="plan-gift-emoji" aria-hidden>🎁</span>
      <div className="plan-gift-body">
        <div className="plan-gift-note">{bonus.note}</div>
        <div className="plan-gift-meta">{copy.bonus.meta(bonus.extra_texts, until)}</div>
      </div>
    </div>
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
  cta: string;
}

function ChipView({ state, title, sub, sent, cap, total, canUpgrade, onOpen, cta }: ChipViewProps) {
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
          {cta}
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
  copy: PaywallCopy;
}

function SheetView({
  state,
  sent,
  cap,
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
  copy,
}: SheetViewProps) {
  const multRaw = cap > 0 ? primaryUpgrade.textLimit / cap : 0;
  const multiplier = cap > 0 ? multRaw.toFixed(multRaw % 1 === 0 ? 0 : 1) : '—';
  const timesReach = contacts > 0 ? Math.floor(primaryUpgrade.textLimit / contacts) : 0;
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
              {copy.sheet.dismiss}
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
                <div className="plan-impact-label">{copy.sheet.impactLabelToday}</div>
                <div className="plan-impact-value">{sent.toLocaleString()}</div>
              </div>
              <div>
                <div className="plan-impact-label">{copy.sheet.impactLabelWith(primaryUpgrade.name)}</div>
                <div className="plan-impact-value plan-impact-value--blue">
                  {primaryUpgrade.textLimit.toLocaleString()}
                  <span className="plan-impact-unit">{copy.sheet.unit}</span>
                </div>
              </div>
            </div>
            <div className="plan-impact-scale">
              <div className="plan-impact-scale-track">
                <div
                  className="plan-impact-scale-current"
                  style={{ width: `${impactCurrentPct}%` }}
                />
                <div
                  className="plan-impact-scale-next"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="plan-impact-note">
                {boldify(copy.sheet.impactNote({
                  mult: multiplier,
                  contacts,
                  times: timesReach,
                  date: resetLabel,
                }))}
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
                  {isHero && <div className="plan-card-badge">{copy.sheet.recommended}</div>}
                  <div className="plan-card-head">
                    <span className="plan-card-name">{plan.name}</span>
                    <span className="plan-card-price">
                      {plan.price}<span className="plan-card-unit">{copy.sheet.unit}</span>
                    </span>
                  </div>
                  <div className="plan-card-texts">{copy.sheet.textsPerMonth(plan.textLimit)}</div>
                  <div className="plan-card-tagline">{copy.sheet.tagline[plan.key]}</div>
                  <ul className="plan-card-features">
                    {copy.sheet.features[plan.key].map((f) => (
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
                    {isLoading ? copy.sheet.redirecting : copy.sheet.cardCta(plan.name)}
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
              ? copy.sheet.redirecting
              : copy.sheet.primaryCta(primaryUpgrade.name, primaryUpgrade.price, copy.sheet.unit)}
          </button>
          <div className="plan-sheet-fineprint">
            {copy.sheet.fineprint}
          </div>
        </div>
      </div>
    </div>
  );
}
