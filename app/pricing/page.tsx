import { PricingTabs, type PricingTab } from "@/components/billing/pricing-tabs";

export default async function PricingPage({ searchParams }: PageProps<"/pricing">) {
  const params = await searchParams;
  const tab: PricingTab = params.tab === "team" ? "team" : "personal";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Plans</h1>
        <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
          Public skills are free. Pay only when you need private ones.
        </p>
      </div>
      <PricingTabs initialTab={tab} />
    </div>
  );
}
