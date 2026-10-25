import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { SkillCard } from "@/components/explore/skill-card";
import { FollowButton } from "@/components/profile/follow-button";
import { getFollowCounts, getProfileByHandle, getProfileSkills, isFollowing } from "@/lib/queries/profile";

export default async function ProfilePage({ params }: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  const { userId } = await auth();
  const [counts, following, skills] = await Promise.all([
    getFollowCounts(profile.id),
    isFollowing(profile.id, userId),
    getProfileSkills(profile.id),
  ]);
  const isOwn = userId === profile.id;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-16">
            {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
            <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
              {profile.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{profile.display_name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">@{profile.handle}</span>
              {profile.stack ? <Badge variant="secondary">{profile.stack}</Badge> : null}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">{counts.followers}</span>{" "}
                {counts.followers === 1 ? "follower" : "followers"}
              </span>
              <span>
                <span className="font-semibold text-foreground">{counts.following}</span> following
              </span>
            </div>
          </div>
        </div>
        {isOwn ? null : (
          <FollowButton
            key={String(following)}
            handle={profile.handle}
            signedIn={Boolean(userId)}
            initialFollowing={following}
          />
        )}
      </header>
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Published skills</h2>
        {skills.length === 0 ? (
          <EmptyState title="No skills yet" body={`@${profile.handle} hasn’t published a skill yet.`} />
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
