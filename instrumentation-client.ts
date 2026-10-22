import posthog from 'posthog-js';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  autocapture: false,
  capture_pageview: 'history_change',
  capture_pageleave: true,
  capture_exceptions: true,
  person_profiles: 'identified_only',
});

// Swarm agents arrive with ?swarm=A&persona=builder&model=... so their traffic can be
// isolated or excluded in one click. Real visitors never have these parameters.
const params = new URLSearchParams(window.location.search);
const swarm = params.get('swarm');
if (swarm) {
  posthog.register({
    cohort: `swarm-${swarm}`,
    persona: params.get('persona') ?? 'unknown',
    model: params.get('model') ?? 'unknown',
  });
}
