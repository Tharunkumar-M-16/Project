// Mirror of the server's lifecycle so the UI updates in real time (no reload needed).
// upcoming -> live (only joinable here) -> ended (after the scheduled hour).
export function classStatus(c) {
  const now = Date.now();
  const start = c.schedule ? new Date(c.schedule).getTime() : null;
  const durationMins = c.durationMins || 60;
  const end = start != null ? start + durationMins * 60000 : null;

  let status;
  if (start == null) status = 'upcoming';
  else if (now < start) status = 'upcoming';
  else if (now <= end) status = 'live';
  else status = 'ended';

  const ranMinutes =
    status === 'ended' ? durationMins
    : status === 'live' ? Math.max(1, Math.round((now - start) / 60000))
    : 0;

  const label = { upcoming: 'Upcoming', live: '● Live now', ended: 'Ended' }[status];
  return { status, canJoin: status === 'live', start, end, ranMinutes, durationMins, label };
}

export function statusBadgeClass(status) {
  return {
    upcoming: 'bg-amber-100 text-amber-700',
    live: 'bg-emerald-100 text-emerald-700 animate-pulse',
    ended: 'bg-slate-200 text-slate-500',
  }[status];
}
