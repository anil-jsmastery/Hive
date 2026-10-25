"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/app/u/[handle]/actions";

export function FollowButton({
  handle,
  signedIn,
  initialFollowing,
}: {
  handle: string;
  signedIn: boolean;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Button asChild>
        <Link href={`/sign-in?redirect_url=/u/${handle}`}>Follow</Link>
      </Button>
    );
  }

  function onClick() {
    startTransition(async () => {
      const result = await toggleFollow(handle);
      if ("needsAuth" in result) return router.push(`/sign-in?redirect_url=/u/${handle}`);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setFollowing(result.following);
    });
  }

  return (
    <Button variant={following ? "outline" : "default"} onClick={onClick} disabled={pending}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
