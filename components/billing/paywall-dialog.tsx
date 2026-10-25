"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { FEATURES } from "@/lib/constants";

type Feature = (typeof FEATURES)[keyof typeof FEATURES];

const COPY: Record<Feature, { body: string; price: string; tab: string }> = {
  private_skills: {
    body: "Upgrade to Pro to publish skills only you can see.",
    price: "Pro: $8/month",
    tab: "personal",
  },
  team_private_skills: {
    body: "Upgrade your team to Team to publish skills only your team can see.",
    price: "Team: $20/month",
    tab: "team",
  },
};

export function PaywallDialog({
  feature,
  open,
  onClose,
  onSeePlans,
  onPublishPublic,
}: {
  feature: Feature | null;
  open: boolean;
  onClose: () => void;
  onSeePlans: () => void;
  onPublishPublic: () => void;
}) {
  const copy = feature ? COPY[feature] : null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      {copy && feature ? (
        <DialogContent>
          {/* Mounts each time the dialog opens, so paywall_shown is sent once per open. */}
          {open ? <TrackOnMount event="paywall_shown" properties={{ feature }} /> : null}
          <DialogHeader>
            <DialogTitle>Private skills are a paid feature</DialogTitle>
            <DialogDescription>{copy.body}</DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-accent p-4 text-sm font-semibold text-accent-foreground">{copy.price}</div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onPublishPublic}>
              Publish as public instead
            </Button>
            <Button asChild>
              <Link href={`/pricing?tab=${copy.tab}&from=publish`} onClick={onSeePlans}>
                See plans
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
