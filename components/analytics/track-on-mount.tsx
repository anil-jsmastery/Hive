'use client';
import { useEffect, useRef } from 'react';
import { trackClient } from '@/lib/analytics/client';
import type { EventName, EventProps } from '@/lib/analytics/events';

// Fires once per mount. Give it a `key` when the same page can show new content
// (for example a new search) so it remounts and fires again.
export function TrackOnMount<E extends EventName>({ event, properties }: { event: E; properties: EventProps[E] }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackClient(event, properties);
  }, [event, properties]);
  return null;
}
