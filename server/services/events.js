/**
 * Real-time event hub (Server-Sent Events).
 *
 * Keeps an in-memory map of userId -> open SSE responses and lets any part of
 * the app push a JSON event to a specific user (or several) instantly, replacing
 * the old 15-second notification polling. Works for a single Node process
 * (the app runs one PM2 instance); for multi-instance you'd swap this for Redis
 * pub/sub, but the call sites (pushToUser / pushToUsers) stay the same.
 */

// Map<string userId, Set<res>>
const clients = new Map();

export function addClient(userId, res) {
  const key = String(userId);
  if (!clients.has(key)) clients.set(key, new Set());
  clients.get(key).add(res);
}

export function removeClient(userId, res) {
  const key = String(userId);
  const set = clients.get(key);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(key);
}

function send(res, event, data) {
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    /* connection already closed — cleanup happens on the 'close' handler */
  }
}

// Push an event to every open connection for one user.
export function pushToUser(userId, event, data) {
  const set = clients.get(String(userId));
  if (!set) return;
  for (const res of set) send(res, event, data);
}

// Push the same event to many users.
export function pushToUsers(userIds, event, data) {
  for (const id of userIds) pushToUser(id, event, data);
}

export function connectedCount() {
  return clients.size;
}
