/**
 * Compute a class's live status from its schedule + duration.
 *   upcoming -> before the scheduled start
 *   live     -> within [start, start + durationMins]  (join allowed only here)
 *   ended    -> after the window closes (e.g. one hour after start)
 */
export function classLifecycle(c) {
  const now = Date.now();
  const start = c.schedule ? new Date(c.schedule).getTime() : null;
  const durationMins = c.durationMins || 60;
  const end = start != null ? start + durationMins * 60000 : null;

  let status;
  if (start == null) status = 'upcoming';
  else if (now < start) status = 'upcoming';
  else if (now <= end) status = 'live';
  else status = 'ended';

  // Minutes the session has run (full duration once ended, elapsed while live)
  const liveMinutes =
    status === 'ended' ? durationMins
    : status === 'live' ? Math.max(1, Math.round((now - start) / 60000))
    : 0;

  return { status, startsAt: start, endsAt: end, durationMins, liveMinutes, canJoin: status === 'live' };
}
