// Paywall i18n dictionary. Scoped to the Engage paywall surface only —
// the rest of the app is English for now. Extend by adding a new locale
// object with the same shape and wiring it into `getCopy`.
//
// Spanish copy is Dominican-leaning in register ("un chin", "bono de
// crecimiento", "otro día", "por la casa") but keeps standard orthography
// so it reads cleanly on-screen.

export type Locale = 'en' | 'es';

export interface PaywallCopy {
  bonus: {
    meta: (extra: number, date: string) => string;
  };
  chip: {
    softTitle: (sent: number, total: number) => string;
    nearTitle: string;
    overTitle: string;
    softSub: (plan: string, date: string) => string;
    nearSub: (left: number, date: string) => string;
    overSub: (date: string) => string;
    cta: string;
  };
  sheet: {
    dismiss: string;
    headlineNear: string;
    headlineOver: string;
    subNear: (p: { sent: number; plan: string; cap: number; bonus: number }) => string;
    subOver: (p: { sent: number; plan: string; contacts: number }) => string;
    impactLabelToday: string;
    impactLabelWith: (plan: string) => string;
    unit: string;
    impactNote: (p: { mult: string; contacts: number; times: number; date: string }) => string;
    recommended: string;
    textsPerMonth: (n: number) => string;
    tagline: Record<'pro' | 'enterprise', string>;
    features: Record<'pro' | 'enterprise', string[]>;
    cardCta: (name: string) => string;
    primaryCta: (plan: string, price: string, unit: string) => string;
    redirecting: string;
    fineprint: string;
  };
}

const en: PaywallCopy = {
  bonus: {
    meta: (extra, date) => `+${extra.toLocaleString()} texts · until ${date}`,
  },
  chip: {
    softTitle: (sent, total) => `${sent.toLocaleString()} of ${total.toLocaleString()} sent this cycle`,
    nearTitle: "You're in your growth bonus 🌱",
    overTitle: "You've reached everyone this cycle 🎉",
    softSub: (plan, date) => `${plan} plan · resets ${date}`,
    nearSub: (left, date) => `${left.toLocaleString()} text${left === 1 ? '' : 's'} left on us · resets ${date}`,
    overSub: (date) => `Everything refreshes ${date}`,
    cta: 'View options',
  },
  sheet: {
    dismiss: 'Maybe later',
    headlineNear: 'Your reach is outgrowing your plan.',
    headlineOver: "You've reached everyone this cycle.",
    subNear: ({ sent, plan, cap, bonus }) =>
      `You've sent ${sent.toLocaleString()} messages this cycle — past your ${plan} plan (${cap.toLocaleString()}) and into the ${bonus.toLocaleString()} texts we added for you. Upgrading gives you real room to breathe.`,
    subOver: ({ sent, plan, contacts }) =>
      `You've sent ${sent.toLocaleString()} messages to your ${contacts} customers — your full ${plan} plan plus every bonus text we added (2 per customer, on us). Let's give you more room to keep showing up.`,
    impactLabelToday: 'Your reach today',
    impactLabelWith: (plan) => `With ${plan}`,
    unit: '/mo',
    impactNote: ({ mult, contacts, times, date }) =>
      `That's **${mult}×** your reach — enough to text every one of your ${contacts} customers **${times} ${times === 1 ? 'time' : 'times'}** before everything refreshes ${date}.`,
    recommended: 'RECOMMENDED',
    textsPerMonth: (n) => `${n.toLocaleString()} texts/month`,
    tagline: {
      pro: 'Reach everyone, every week',
      enterprise: "For when you're doing it big",
    },
    features: {
      pro: ['1,500 sends per month', 'Delivery reports', 'Unlimited customers'],
      enterprise: ['4,000 sends per month', 'Priority support', 'Unlimited customers'],
    },
    cardCta: (name) => `Upgrade to ${name} →`,
    primaryCta: (plan, price, unit) => `Upgrade to ${plan} · ${price}${unit} →`,
    redirecting: 'Redirecting…',
    fineprint: "Change anytime. We'll always have your back.",
  },
};

const es: PaywallCopy = {
  bonus: {
    meta: (extra, date) => `+${extra.toLocaleString()} mensajes · hasta el ${date}`,
  },
  chip: {
    softTitle: (sent, total) => `${sent.toLocaleString()} de ${total.toLocaleString()} enviados este ciclo`,
    nearTitle: 'Estás en tu bono de crecimiento 🌱',
    overTitle: 'Ya llegaste a todos este ciclo 🎉',
    softSub: (plan, date) => `Plan ${plan} · se renueva ${date}`,
    nearSub: (left, date) => `Te quedan ${left.toLocaleString()} mensaje${left === 1 ? '' : 's'} de regalo · se renueva ${date}`,
    overSub: (date) => `Todo se renueva el ${date}`,
    cta: 'Ver opciones',
  },
  sheet: {
    dismiss: 'Otro día',
    headlineNear: 'Tu alcance está creciendo más que tu plan.',
    headlineOver: 'Ya llegaste a todos este ciclo.',
    subNear: ({ sent, plan, cap, bonus }) =>
      `Enviaste ${sent.toLocaleString()} mensajes este ciclo — pasaste tu plan ${plan} (${cap.toLocaleString()}) y entraste a los ${bonus.toLocaleString()} que te regalamos. Subir de plan te da más aire para seguir.`,
    subOver: ({ sent, plan, contacts }) =>
      `Enviaste ${sent.toLocaleString()} mensajes a tus ${contacts} clientes — tu plan ${plan} completo más todo el bono que te regalamos (2 por cliente, por la casa). Vamos a darte más espacio para seguir apareciendo.`,
    impactLabelToday: 'Tu alcance hoy',
    impactLabelWith: (plan) => `Con ${plan}`,
    unit: '/mes',
    impactNote: ({ mult, contacts, times, date }) =>
      `Eso es **${mult}×** tu alcance — suficiente para escribirle a tus ${contacts} clientes **${times} ${times === 1 ? 'vez' : 'veces'}** antes de que todo se renueve el ${date}.`,
    recommended: 'RECOMENDADO',
    textsPerMonth: (n) => `${n.toLocaleString()} mensajes/mes`,
    tagline: {
      pro: 'Llega a todos, todas las semanas',
      enterprise: 'Para cuando ya estás en otro nivel',
    },
    features: {
      pro: ['1,500 envíos al mes', 'Reportes de entrega', 'Clientes ilimitados'],
      enterprise: ['4,000 envíos al mes', 'Soporte prioritario', 'Clientes ilimitados'],
    },
    cardCta: (name) => `Pasar a ${name} →`,
    primaryCta: (plan, price, unit) => `Pasar a ${plan} · ${price}${unit} →`,
    redirecting: 'Un momento…',
    fineprint: 'Cambia cuando quieras. Siempre tenemos tu espalda.',
  },
};

export function getCopy(locale: string): PaywallCopy {
  return locale === 'es' ? es : en;
}

/** Format a reset date consistently per locale. */
export function formatResetDate(iso: string, locale: string, length: 'short' | 'long' = 'long'): string {
  const loc = locale === 'es' ? 'es-DO' : 'en-US';
  return new Date(iso).toLocaleDateString(loc, { month: length, day: 'numeric' });
}
