import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PublishStarted } from "@/components/publish/publish-started";
import { PublishForm } from "@/components/publish/publish-form";
import type { Variant } from "@/lib/analytics/events";
import { getFlag } from "@/lib/analytics/server";
import { ensureOrganization } from "@/lib/organization";
import { getCurrentProfile } from "@/lib/profile";

export default async function PublishPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/publish");

  const [profile, org] = await Promise.all([getCurrentProfile(), ensureOrganization()]);
  if (!profile) redirect("/sign-in?redirect_url=/publish");
  const flag = await getFlag(profile.id, 'publish-flow-v2');
  const variant: Variant = flag === 'test' ? 'test' : 'control';

  return (
    <>
      <PublishStarted variant={variant} />
      <PublishForm variant={variant} handle={profile?.handle ?? ""} teamName={org?.name ?? null} />
    </>
  );
}
