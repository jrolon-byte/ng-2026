import { useEffect, useState } from 'react';
import { getReferralStats, type ReferralStats } from '../services/referrals';

/**
 * "Refer & earn" card on the Dashboard — every org gets one. Shows the
 * shareable code/link and what the referrals are earning: $5/mo off per
 * active referral, forever, until that referral cancels. Bilingual copy
 * keyed off the org locale, same approach as the paywall.
 */

const COPY = {
  en: {
    title: 'Refer & earn',
    subtitle: 'Your link signs friends up on Pro (1,500 texts/mo). Every shop you refer takes $5/mo off your bill — for as long as they stay. Refer enough and NotifyGrid is free.',
    yourCode: 'Your code',
    copyLink: 'Copy invite link',
    copied: 'Copied!',
    earning: 'earning you',
    perMonth: '/mo off',
    none: 'No referrals yet — share your link and start stacking discounts.',
    statusEarning: 'Earning',
    statusPending: 'Signed up',
    statusEnded: 'Ended',
  },
  es: {
    title: 'Refiere y gana',
    subtitle: 'Tu enlace registra a tus amigos directo en Pro (1,500 mensajes/mes). Cada negocio que refieras te quita $5/mes de tu factura — mientras sigan activos. Refiere suficientes y NotifyGrid te sale gratis.',
    yourCode: 'Tu código',
    copyLink: 'Copiar enlace',
    copied: '¡Copiado!',
    earning: 'ganándote',
    perMonth: '/mes de descuento',
    none: 'Aún no tienes referidos — comparte tu enlace y empieza a acumular descuentos.',
    statusEarning: 'Ganando',
    statusPending: 'Registrado',
    statusEnded: 'Terminó',
  },
} as const;

export default function ReferralCard() {
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
    earning: t.statusEarning,
    pending: t.statusPending,
    ended: t.statusEnded,
  } as const;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="admin-section referral-card">
      <h2>{t.title}</h2>
      <p className="admin-subtitle">{t.subtitle}</p>

      <div className="referral-share">
        <div className="referral-code-box">
          <span className="referral-code-label">{t.yourCode}</span>
          <span className="referral-code">{stats.code}</span>
        </div>
        <button type="button" className="gift-submit" onClick={copyLink}>
          {copied ? t.copied : t.copyLink}
        </button>
        {stats.earning_count > 0 && (
          <span className="referral-earning">
            {stats.earning_count} × $5 = <strong>${(stats.monthly_credit_cents / 100).toFixed(0)}{t.perMonth}</strong>
          </span>
        )}
      </div>

      {stats.referrals.length === 0 ? (
        <p className="referral-empty">{t.none}</p>
      ) : (
        <div className="referral-list">
          {stats.referrals.map((r, i) => (
            <div key={i} className="referral-row">
              <span className="referral-row-name">{r.name}</span>
              <span className={`companies-badge referral-badge--${r.status}`}>
                {statusLabel[r.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
