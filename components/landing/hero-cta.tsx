"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trackClient } from "@/lib/analytics/client";

export function HeroCta() {
  return (
    <Button size="lg" asChild>
      <Link href="/explore" onClick={() => trackClient("landing_cta_clicked", { cta: "hero" })}>
        Explore skills
      </Link>
    </Button>
  );
}
