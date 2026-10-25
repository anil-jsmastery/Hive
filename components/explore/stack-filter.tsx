import Link from "next/link";
import { STACKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function exploreHref(q: string, stack: string | null) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (stack) params.set("stack", stack);
  const search = params.toString();
  return search ? `/explore?${search}` : "/explore";
}

export function StackFilter({ q, stack }: { q: string; stack: string | null }) {
  const options = [null, ...STACKS];

  return (
    <nav aria-label="Filter by stack" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option === stack;
        return (
          <Link
            key={option ?? "All"}
            href={exploreHref(q, option)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {option ?? "All"}
          </Link>
        );
      })}
    </nav>
  );
}
