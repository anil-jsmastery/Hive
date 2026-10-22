import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="space-y-3 py-10 text-center">
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Page not found
      </h1>
      <p className="mx-auto max-w-prose text-base leading-relaxed text-muted-foreground">
        This page doesn’t exist. Head back to Explore to find a skill.
      </p>
      <div className="pt-3">
        <Button asChild>
          <Link href="/explore">Explore skills</Link>
        </Button>
      </div>
    </div>
  );
}
