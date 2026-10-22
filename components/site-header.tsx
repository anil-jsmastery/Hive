import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HiveMark } from "@/components/hive-mark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-card">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <HiveMark className="size-6 text-primary" />
          <span className="font-display font-bold">Hive</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/explore">Explore</Link>
          </Button>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/publish">Publish</Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="sm:hidden">
            <Link href="/explore" aria-label="Explore">
              <Search className="size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="sm:hidden">
            <Link href="/publish" aria-label="Publish">
              <Plus className="size-5" />
            </Link>
          </Button>
        </nav>
        <Button asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </header>
  );
}
