import { EmptyState } from "@/components/empty-state";
import { openNotification } from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/lib/queries/notifications";
import { timeAgo } from "@/lib/time";

function describe(n: NotificationRow) {
  const actor = `@${n.actor?.handle ?? ""}`;
  if (n.type === "fork") return `${actor} forked ${n.skill?.title ?? ""}`;
  if (n.type === "comment") return `${actor} commented on ${n.skill?.title ?? ""}`;
  return `${actor} followed you`;
}

export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  if (notifications.length === 0) {
    return <EmptyState title="Nothing yet" body="When someone forks, comments or follows, it shows up here." />;
  }

  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {notifications.map((n) => (
        <li key={n.id}>
          <form action={openNotification.bind(null, n.id)}>
            <button
              type="submit"
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                !n.read_at && "bg-accent hover:bg-accent",
              )}
            >
              {!n.read_at ? <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary" /> : null}
              <span className="flex-1 text-base leading-relaxed">{describe(n)}</span>
              <span className="shrink-0 text-right text-sm text-muted-foreground">{timeAgo(n.created_at)}</span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
