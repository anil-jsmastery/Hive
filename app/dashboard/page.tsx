import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { SkillCard } from "@/components/explore/skill-card";
import { NotificationList } from "@/components/dashboard/notification-list";
import { listNotifications } from "@/lib/queries/notifications";
import { CARD_FIELDS, type SkillCardData } from "@/lib/queries/search";
import { createServerSupabase } from "@/lib/supabase/server";

async function mySkills(userId: string, forks: boolean): Promise<SkillCardData[]> {
  const supabase = await createServerSupabase();
  const query = supabase.from("skills").select(CARD_FIELDS).eq("author_id", userId);
  const { data, error } = await (forks ? query.not("forked_from_id", "is", null) : query.is("forked_from_id", null))
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SkillCardData[];
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard");

  const [notifications, skills, forks] = await Promise.all([
    listNotifications(),
    mySkills(userId, false),
    mySkills(userId, true),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Dashboard</h1>
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Notifications</h2>
        <NotificationList notifications={notifications} />
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Your skills</h2>
        {skills.length === 0 ? (
          <EmptyState
            title="No skills yet"
            body="You haven’t published a skill yet."
            action={
              <Button asChild>
                <Link href="/publish">Publish a skill</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {skills.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Your forks</h2>
        {forks.length === 0 ? (
          <EmptyState
            title="No forks yet"
            body="Fork a skill to make your own version."
            action={
              <Button variant="outline" asChild>
                <Link href="/explore">Explore skills</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {forks.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
