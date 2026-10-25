import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { HiveMark } from "@/components/hive-mark";
import { cn } from "@/lib/utils";
import { latestActivity } from "@/lib/queries/activity";
import { timeAgo } from "@/lib/time";

const VERBS: Record<string, string> = {
  published: "published",
  forked: "forked",
  starred: "starred",
  commented: "commented on",
};

const MARKERS: Record<string, string> = {
  published: "text-primary",
  forked: "text-foreground",
  starred: "text-primary/60",
  commented: "text-muted-foreground",
};

export async function ActivityRail() {
  const activities = await latestActivity();

  return (
    <Card>
      <CardContent className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Happening now</h2>
        {activities.length === 0 ? (
          <EmptyState title="It’s quiet in here" body="New skills will show up here as people publish them." />
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-start gap-2">
                <HiveMark className={cn("mt-1.5 size-3 shrink-0", MARKERS[activity.type])} />
                <p className="flex-1 text-base leading-relaxed">
                  {activity.actor?.display_name} {VERBS[activity.type]}{" "}
                  {activity.skill ? (
                    <Link href={`/s/${activity.skill.slug}`} className="font-medium hover:underline">
                      {activity.skill.title}
                    </Link>
                  ) : null}
                </p>
                <span className="shrink-0 text-right text-sm text-muted-foreground">
                  {timeAgo(activity.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
