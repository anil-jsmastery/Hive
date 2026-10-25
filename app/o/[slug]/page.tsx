import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { SkillCard } from "@/components/explore/skill-card";
import { CARD_FIELDS, type SkillCardData } from "@/lib/queries/search";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function TeamPage({ params }: PageProps<"/o/[slug]">) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data: team, error } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!team) notFound();

  // RLS shows private team skills only to members with this team active.
  const { data, error: skillsError } = await supabase
    .from("skills")
    .select(CARD_FIELDS)
    .eq("org_id", team.id)
    .order("created_at", { ascending: false });
  if (skillsError) throw skillsError;
  const skills = (data ?? []) as unknown as SkillCardData[];

  return (
    <div className="space-y-8">
      <header className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-2xl font-semibold">
          {team.name.charAt(0).toUpperCase()}
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{team.name}</h1>
          <Badge variant="secondary">
            <Users />
            Team
          </Badge>
        </div>
      </header>
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Team skills</h2>
        {skills.length === 0 ? (
          <EmptyState title="No team skills yet" body={`Skills published for ${team.name} show up here.`} />
        ) : (
          <div className="grid gap-3">
            {skills.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
