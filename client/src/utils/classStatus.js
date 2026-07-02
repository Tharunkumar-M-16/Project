// Prefer the server-computed lifecycle (avoids client clock-skew bugs); fall back
// to a local computation only if the server didn't attach one.
export function classStatus(c) {
  const lc = c?.lifecycle;
  const durationMins = c.durationMins || 60;
  const start = c.schedule ? new Date(c.schedule).getTime() : null;

  let status, ranMinutes, end;
  if (lc && lc.status) {
    status = lc.status;
    ranMinutes = lc.liveMinutes ?? 0;
    end = lc.endsAt ?? (start != null ? start + durationMins * 60000 : null);
  } else {
    const now = Date.now();
    end = start != null ? start + durationMins * 60000 : null;
    if (start == null || now < start) status = 'upcoming';
    else if (now <= end) status = 'live';
    else status = 'ended';
    ranMinutes = status === 'ended' ? durationMins : status === 'live' ? Math.max(1, Math.round((now - start) / 60000)) : 0;
  }

  const label = { upcoming: 'Upcoming', live: '● Live now', ended: 'Ended' }[status];
  return { status, canJoin: status === 'live', start, end, ranMinutes, durationMins, label };
}

export function statusBadgeClass(status) {
  return {
    upcoming: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    live: 'bg-emerald-100 text-emerald-700 animate-pulse dark:bg-emerald-500/20 dark:text-emerald-300',
    ended: 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  }[status];
}
