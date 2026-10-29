import { useEffect, useState } from 'react';
import { getReferralStats, type ReferralStats } from '../services/referrals';

/**
 * "Refer and earn" — the standout card on Engage. Shows the shareable code
 * and link, what the referrals have earned (one-time $5 per successful
 * referral, no cap), and a ladder of what 1, 3, 5 and 10 referrals take off
 * the next bill. Bilingual copy keyed off the org locale, same approach as
 * the paywall.
 *
 * The credit is a one-time Stripe balance credit on the owner's customer, so
 * a First Blast owner earns it too; for them it waits for the first monthly
 * bill, and the card says so instead of "off your bill".
 */

const CREDIT = 5;
const LADDER = [1, 3, 5, 10];

const COPY = {
  en: {
    title: 'Refer and earn',
    creditedNow: (n: number, dollars: number) => `${n} referral${n === 1 ? '' : 's'} credited · $${dollars} off`,
    nothingYet: 'Nothing earned yet',
    waiting: (dollars: number) => `$${dollars} credit waiting for your first monthly bill`,
    subtitle: 'Every shop you refer that signs up on Pro takes $5 off your next bill, once. No cap: ten referrals in a month is $50 off that month.',
    yourCode: 'Your code',
    copyLink: 'Copy invite link',
    copied: 'Copied!',
    ladderTitle: 'What your referrals take off your next bill.',
    ladderNote: (plan: string, price: number) => `You are on ${plan} at $${price}/mo, so ten referrals cover a whole month.`,
    ladderExample: 'The credit sits on your account and comes off your first monthly bill once you choose a plan.',
    referrals: (n: number) => `${n} referral${n === 1 ? '' : 's'}`,
    off: 'off',
    youAreHere: 'You are here',
    none: 'No referrals yet. Share your link and start stacking credit.',
    statusCredited: 'Credited',
    statusPending: 'Signed up',
    statusEnded: 'Ended',
  },
  es: {
    title: 'Refiere y gana',
    creditedNow: (n: number, dollars: number) => `${n} referido${n === 1 ? '' : 's'} acreditado${n === 1 ? '' : 's'} · $${dollars} de descuento`,
    nothingYet: 'Aún no has ganado nada',
    waiting: (dollars: number) => `$${dollars} de crédito esperando tu primera factura mensual`,
    subtitle: 'Cada negocio que refieras y se registre en Pro te quita $5 de tu próxima factura, una vez. Sin límite: diez referidos en un mes son $50 de descuento ese mes.',
    yourCode: 'Tu código',
    copyLink: 'Copiar enlace',
    copied: '¡Copiado!',
    ladderTitle: 'Lo que tus referidos le quitan a tu próxima factura.',
    ladderNote: (plan: string, price: number) => `Estás en ${plan} a $${price}/mes, así que diez referidos cubren un mes completo.`,
    ladderExample: 'El crédito queda en tu cuenta y se descuenta de tu primera factura mensual cuando elijas un plan.',
    referrals: (n: number) => `${n} referido${n === 1 ? '' : 's'}`,
    off: 'de descuento',
    youAreHere: 'Estás aquí',
    none: 'Aún no tienes referidos. Comparte tu enlace y empieza a acumular crédito.',
    statusCredited: 'Acreditado',
    statusPending: 'Registrado',
    statusEnded: 'Terminó',
  },
} as const;

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 6 21l1.3-6.8-5-4.7 6.8-.8z" />
  </svg>
);

/**
 * Plan name and price by monthly text limit. Kept in step with PLAN_DETAILS
 * in PlanUsage.tsx and PLAN_CATALOG in stripe-checkout.ts. Returns null for
 * First Blast (100), which has no monthly bill.
 */
export function planByLimit(textLimit: number): { name: string; price: number } | null {
  const table: Record<number, { name: string; price: number }> = {
    600: { name: 'Starter', price: 29 },
    1500: { name: 'Pro', price: 49 },
    4000: { name: 'Enterprise', price: 149 },
  };
  return table[textLimit] ?? null;
}

interface Props {
  /** The owner's plan, or null for First Blast (no monthly bill yet). */
  plan: { name: string; price: number } | null;
}

export default function ReferralCard({ plan }: Props) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getReferralStats()
      .then(setStats)
      .catch(() => setStats(null)); // non-critical card — fail silent
  }, []);

  if (!stats) return null;

  const t = COPY[stats.locale] ?? COPY.en;
  const link = `${window.location.origin}/signup?ref=${stats.code}`;
  const statusLabel = {
    credited: t.statusCredited,
    pending: t.statusPending,
    ended: t.statusEnded,
  } as const;

  const credited = stats.credited_count;
  const dollars = stats.credit_cents / 100;
  // The credit is a one-time Stripe balance credit, so every referrer earns
  // it. A First Blast owner simply has no monthly bill yet for it to land
  // on: say "waiting", never "off your bill".
  const hasPlan = plan !== null;
  // Highlight the highest rung the owner has reached.
  const reached = LADDER.filter((n) => n <= credited).pop() ?? null;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="referral" aria-label={t.title}>
      <div className="referral-head">
        <span className="referral-star"><StarIcon /></span>
        <div>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
        <span className={`pill ${credited > 0 && hasPlan ? 'pill--ok' : ''} referral-now`}>
          {credited === 0 ? t.nothingYet : hasPlan ? t.creditedNow(credited, dollars) : t.waiting(dollars)}
        </span>
      </div>

      <div className="referral-share">
        <div className="referral-code-box">
          <span className="referral-code-label">{t.yourCode}</span>
          <span className="referral-code">{stats.code}</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={copyLink}>
          {copied ? t.copied : t.copyLink}
        </button>
      </div>

      <p className="referral-ladder-title">
        {t.ladderTitle} {plan ? t.ladderNote(plan.name, plan.price) : t.ladderExample}
      </p>
      <div className="referral-ladder">
        {LADDER.map((n) => {
          const here = n === reached;
          return (
            <div key={n} className={`referral-rung${here ? ' referral-rung--here' : ''}${n <= credited ? ' referral-rung--done' : ''}`}>
              <span className="referral-rung-label">{t.referrals(n)}</span>
              <span className="referral-rung-value">${CREDIT * n}<small>{t.off}</small></span>
              {here && <span className="referral-rung-here">{t.youAreHere}</span>}
            </div>
          );
        })}
      </div>

      {stats.referrals.length === 0 ? (
        <p className="referral-empty">{t.none}</p>
      ) : (
        <div className="referral-list">
          {stats.referrals.map((r, i) => (
            <div key={i} className="referral-row">
              <span className="referral-row-name">{r.name}</span>
              <span className={`pill referral-badge--${r.status}`}>{statusLabel[r.status]}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
