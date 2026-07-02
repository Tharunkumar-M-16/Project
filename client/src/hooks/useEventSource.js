import { useEffect, useRef } from 'react';

// Subscribe to the server's SSE stream (/api/events). Calls onEvent(eventName, data)
// for each named event. Auto-reconnects (EventSource does this natively).
export default function useEventSource(onEvent, events = ['notification']) {
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
    const handlers = events.map((name) => {
      const fn = (e) => {
        let data = {};
        try {
          data = JSON.parse(e.data);
        } catch {
          /* ignore non-JSON */
        }
        cbRef.current?.(name, data);
      };
      es.addEventListener(name, fn);
      return [name, fn];
    });
    return () => {
      handlers.forEach(([name, fn]) => es.removeEventListener(name, fn));
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.join(',')]);
}
