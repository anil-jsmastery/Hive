"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { trackClient } from "@/lib/analytics/client";

// Sends share_link_opened once when the page was opened from a shared link, then drops ?ref.
export function ShareTracker({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || searchParams.get("ref") !== "share") return;
    sent.current = true;
    trackClient("share_link_opened", { slug });
    const params = new URLSearchParams(window.location.search);
    params.delete("ref");
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }, [slug, router, pathname, searchParams]);

  return null;
}
