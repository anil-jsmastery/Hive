"use client";
import { useState } from "react";
import { OrganizationSwitcher, PricingTable, useOrganization } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { TrackOnMount } from "@/components/analytics/track-on-mount";

export type PricingTab = "personal" | "team";

export function PricingTabs({ initialTab, fromPublish }: { initialTab: PricingTab; fromPublish: boolean }) {
  const [tab, setTab] = useState<PricingTab>(initialTab);
  // Only upgrades started from the publish paywall return to the editor.
  const redirect = fromPublish ? { newSubscriptionRedirectUrl: "/publish?upgraded=1" } : {};
  const { organization } = useOrganization();

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as PricingTab)}>
      <TabsList>
        <TabsTrigger value="personal">For you</TabsTrigger>
        <TabsTrigger value="team">For teams</TabsTrigger>
      </TabsList>
      <TabsContent value="personal">
        <PricingTable {...redirect} />
      </TabsContent>
      <TabsContent value="team">
        {organization ? (
          <PricingTable for="organization" {...redirect} />
        ) : (
          <EmptyState
            title="No team selected"
            body="Create or switch to a team to see team plans."
            action={<OrganizationSwitcher hidePersonal />}
          />
        )}
      </TabsContent>
      <TrackOnMount key={tab} event="pricing_viewed" properties={{ tab }} />
    </Tabs>
  );
}
