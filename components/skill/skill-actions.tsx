"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { forkSkill, installSkill, toggleStar } from "@/app/s/[slug]/actions";

export function SkillActions({
  slug,
  visibility,
  initialStarred,
}: {
  slug: string;
  visibility: "public" | "private";
  initialStarred: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [starred, setStarred] = useState(initialStarred);
  const [pending, startTransition] = useTransition();
  const publishedShown = useRef(false);

  useEffect(() => {
    if (publishedShown.current || searchParams.get("published") !== "1") return;
    publishedShown.current = true;
    toast("Published");
    const params = new URLSearchParams(window.location.search);
    params.delete("published");
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  function goToSignIn() {
    router.push(`/sign-in?redirect_url=/s/${slug}`);
  }

  function onInstall() {
    startTransition(async () => {
      const result = await installSkill(slug);
      if ("needsAuth" in result) return goToSignIn();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      await navigator.clipboard.writeText(result.command);
      toast("Install command copied", {
        description: <span className="font-mono">{result.command}</span>,
      });
    });
  }

  function onStar() {
    startTransition(async () => {
      const result = await toggleStar(slug);
      if ("needsAuth" in result) return goToSignIn();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setStarred(result.starred);
      toast(result.starred ? "Starred" : "Star removed");
    });
  }

  function onFork() {
    startTransition(async () => {
      const result = await forkSkill(slug);
      if ("needsAuth" in result) return goToSignIn();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.push(`/s/${result.slug}`);
      toast("Forked to your skills");
    });
  }

  async function onShare() {
    await navigator.clipboard.writeText(`${location.origin}/s/${slug}?ref=share`);
    toast("Link copied");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={onInstall} disabled={pending}>
        Install
      </Button>
      <Button variant="outline" onClick={onStar} disabled={pending}>
        <Star className={starred ? "fill-primary text-primary" : undefined} />
        {starred ? "Starred" : "Star"}
      </Button>
      {visibility === "public" ? (
        <>
          <Button variant="outline" onClick={onFork} disabled={pending}>
            Fork
          </Button>
          <Button variant="ghost" onClick={onShare}>
            Share
          </Button>
        </>
      ) : null}
    </div>
  );
}
