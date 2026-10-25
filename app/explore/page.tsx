import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { SearchForm } from "@/components/explore/search-form";
import { StackFilter } from "@/components/explore/stack-filter";
import { SkillCard } from "@/components/explore/skill-card";
import { STACKS } from "@/lib/constants";
import { searchSkills } from "@/lib/queries/search";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const params = await searchParams;
  const q = (first(params.q) ?? "").trim();
  const rawStack = first(params.stack);
  const stack = rawStack && (STACKS as readonly string[]).includes(rawStack) ? rawStack : null;
  const results = await searchSkills(q, stack);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Explore skills</h1>
      <SearchForm q={q} stack={stack} />
      <StackFilter q={q} stack={stack} />
      <section className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "skill" : "skills"}
        </p>
        {q && results.length === 0 ? (
          <EmptyState
            title={`No skills match “${q}”`}
            body="Try a shorter search, or browse every skill."
            action={
              <Button variant="outline" asChild>
                <Link href="/explore">Browse all skills</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {results.map((skill, index) => (
              <SkillCard key={skill.slug} skill={skill} query={q || undefined} rank={index + 1} />
            ))}
          </div>
        )}
      </section>
      {q ? (
        <TrackOnMount key={`${q}|${stack ?? 'All'}`} event="search_performed"
          properties={{ query: q, stack: stack ?? 'All', result_count: results.length }} />
      ) : null}
    </div>
  );
}
