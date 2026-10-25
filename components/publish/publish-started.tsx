"use client";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import type { Variant } from "@/lib/analytics/events";

// Sends publish_started once when the publish page mounts.
export function PublishStarted({ variant }: { variant: Variant }) {
  return <TrackOnMount event="publish_started" properties={{ variant }} />;
}
