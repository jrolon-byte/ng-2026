/**
 * The ONE copy of the usage/grace math. Previously duplicated verbatim in
 * campaign-send.ts and dashboard-stats.ts — a formula change had to be made
 * twice or the paywall UI and the send gate would disagree.
 *
 * Note the callers deliberately supply their own contact count:
 * campaign-send counts the SENDABLE set (active + opted_in), dashboard-stats
 * counts all active contacts. That asymmetry is preserved, not a bug to fix
 * here.
 */

export interface GraceInput {
  textLimit: number;
  contactCount: number;
  bonusExtra: number;
  bonusExpiresAt: string | null;
  now?: Date;
}

export function computeGraceLimit({
  textLimit,
  contactCount,
  bonusExtra,
  bonusExpiresAt,
  now = new Date(),
}: GraceInput): { graceLimit: number; bonusActive: boolean } {
  const standardGrace = textLimit + contactCount * 2;

  // Per-org one-time bonus — only active while bonus_expires_at is in the
  // future. When it expires the grace naturally drops back to the standard
  // formula; no cron/cleanup job needed.
  const bonusActive =
    bonusExtra > 0 && bonusExpiresAt != null && new Date(bonusExpiresAt) > now;

  return { graceLimit: standardGrace + (bonusActive ? bonusExtra : 0), bonusActive };
}

/** Current calendar-month window, ISO strings — the usage counting period. */
export function currentMonthWindow(now = new Date()): {
  monthStart: string;
  monthEnd: string;
} {
  return {
    monthStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    monthEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
  };
}
