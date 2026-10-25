import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { LayoutDashboard, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HiveMark } from "@/components/hive-mark";
import { UserMenu } from "@/components/user-menu";
import { getCurrentProfile } from "@/lib/profile";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

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
        <Show when="signed-out">
          <SignInButton>
            <Button>Sign in</Button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-1">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="sm:hidden">
              <Link href="/dashboard" aria-label="Dashboard">
                <LayoutDashboard className="size-5" />
              </Link>
            </Button>
            <UserMenu handle={profile?.handle ?? null} />
          </div>
        </Show>
      </div>
    </header>
  );
}
