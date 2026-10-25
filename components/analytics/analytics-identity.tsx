'use client';
import { useEffect, useRef } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import posthog from 'posthog-js';

// Links the anonymous visitor to the Clerk user, resets on sign-out,
// and attaches the active team as a PostHog group.
export function AnalyticsIdentity({ stack }: { stack: string | null }) {
  const { isLoaded, user } = useUser();
  const { organization } = useOrganization();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      if (lastUserId.current) posthog.reset();
      lastUserId.current = null;
      return;
    }
    lastUserId.current = user.id;
    if (posthog.get_distinct_id() === user.id) return;
    posthog.identify(user.id, {
      handle: user.username ?? '',
      name: user.fullName ?? user.username ?? '',
      ...(stack ? { stack } : {}),
      cohort: posthog.get_property('cohort') ?? 'human',
      persona: posthog.get_property('persona') ?? 'none',
    });
  }, [isLoaded, user, stack]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!organization) {
      posthog.resetGroups();
      return;
    }
    posthog.group('organization', organization.id, { name: organization.name, slug: organization.slug ?? '' });
  }, [isLoaded, organization]);

  return null;
}
