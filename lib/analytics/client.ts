'use client';
import posthog from 'posthog-js';
import type { EventName, EventProps } from './events';

export function trackClient<E extends EventName>(event: E, properties: EventProps[E]) {
  posthog.capture(event, properties);
}
