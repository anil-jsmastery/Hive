import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Lock, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { SkillActions } from "@/components/skill/skill-actions";
import { Markdown } from "@/components/skill/markdown";
import { ShareTracker } from "@/components/skill/share-tracker";
import { Comments } from "@/components/skill/comments";
import { getSkill, hasStarred } from "@/lib/queries/skill";

export default async function SkillPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const skill = await getSkill(slug);
  if (!skill) notFound();

  const { userId } = await auth();
  const starred = await hasStarred(skill.id, userId);
  const visibility = skill.visibility === "private" ? "private" : "public";
  const authorHandle = skill.author?.handle ?? "";

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{skill.title}</h1>
        <p className="max-w-prose text-lg text-muted-foreground">{skill.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          {skill.author ? (
            <span className="text-sm text-muted-foreground">
              by{" "}
              <Link href={`/u/${skill.author.handle}`} className="font-medium text-foreground hover:underline">
                @{skill.author.handle}
              </Link>
            </span>
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
          {visibility === "private" ? (
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
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="size-4 text-primary" />
            {skill.stars_count}
          </span>
        </div>
        {skill.forked_from ? (
          <p className="text-sm text-muted-foreground">
            Forked from{" "}
            <Link href={`/s/${skill.forked_from.slug}`} className="font-medium text-foreground hover:underline">
              {skill.forked_from.title}
            </Link>{" "}
            by @{skill.forked_from.author?.handle}
          </p>
        ) : null}
      </header>
      <SkillActions key={skill.id} slug={skill.slug} visibility={visibility} initialStarred={starred} />
      <Markdown content={skill.content} />
      <Comments skillId={skill.id} slug={skill.slug} signedIn={Boolean(userId)} />
      <TrackOnMount
        event="skill_viewed"
        properties={{ slug: skill.slug, stack: skill.stack, author_handle: authorHandle, visibility }}
      />
      <ShareTracker slug={skill.slug} />
    </div>
  );
}
