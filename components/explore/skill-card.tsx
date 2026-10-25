"use client";
import Link from "next/link";
import { Lock, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trackClient } from "@/lib/analytics/client";
import type { SkillCardData } from "@/lib/queries/search";

export function SkillCard({ skill, query, rank }: { skill: SkillCardData; query?: string; rank?: number }) {
  return (
    <article className="space-y-3 rounded-xl border bg-card p-4">
      <Link
        href={`/s/${skill.slug}`}
        className="block text-lg font-semibold hover:underline"
        onClick={() => {
          if (query !== undefined && rank !== undefined) {
            trackClient("search_result_opened", { query, rank, slug: skill.slug });
          }
        }}
      >
        {skill.title}
      </Link>
      <p className="text-sm text-muted-foreground">{skill.description}</p>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {skill.author ? (
            <Link href={`/u/${skill.author.handle}`} className="text-sm font-medium hover:underline">
              @{skill.author.handle}
            </Link>
          ) : null}
          <Badge variant="secondary">{skill.stack}</Badge>
          {skill.org ? (
            <Badge variant="secondary" asChild>
              <Link href={`/o/${skill.org.slug}`}>
                <Users />
                {skill.org.name}
              </Link>
            </Badge>
          ) : null}
          {skill.visibility === "private" ? (
            <Badge variant="outline">
              <Lock />
              Private
            </Badge>
          ) : null}
          {skill.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
          <Star className="size-4 text-primary" />
          {skill.stars_count}
        </span>
      </div>
    </article>
  );
}
