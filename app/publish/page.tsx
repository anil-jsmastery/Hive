import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PublishStarted } from "@/components/publish/publish-started";
import { PublishForm } from "@/components/publish/publish-form";
import type { Variant } from "@/lib/analytics/events";

export default async function PublishPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/publish");

  const variant: Variant = "control";

  return (
    <>
      <PublishStarted variant={variant} />
      <PublishForm variant={variant} />
    </>
  );
}
