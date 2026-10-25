import { HeroCta } from "@/components/landing/hero-cta";
import { ActivityRail } from "@/components/landing/activity-rail";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="grid gap-8 sm:grid-cols-12">
      <section className="space-y-3 sm:col-span-7">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">The registry for agent skills.</h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Find, install and share the Markdown playbooks your AI agents run on.
        </p>
        <div className="pt-3">
          <HeroCta />
        </div>
      </section>
      <section className="sm:col-span-5">
        <ActivityRail />
      </section>
    </div>
  );
}
