import Session from '../models/Session.js';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // run every 5 minutes

/**
 * Marks sessions inactive once they've gone quiet for IDLE_TIMEOUT_MS.
 * This lets us distinguish "currently active session" from "historical session"
 * for things like an accurate live-session count vs all-time totals.
 */
export async function sweepStaleSessions() {
  const cutoff = new Date(Date.now() - IDLE_TIMEOUT_MS);

  const result = await Session.updateMany(
    { isActive: true, lastActivityAt: { $lt: cutoff } },
    { $set: { isActive: false } }
  );

  if (result.modifiedCount > 0) {
    console.log(`[sweeper] closed out ${result.modifiedCount} stale session(s)`);
  }
}

export function startSessionSweeper() {
  setInterval(() => {
    sweepStaleSessions().catch((err) => console.error('[sweeper] error:', err.message));
  }, SWEEP_INTERVAL_MS);
  console.log('[sweeper] session sweeper job started');
}
