"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SearchForm({ q, stack }: { q: string; stack: string | null }) {
  const router = useRouter();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (stack) params.set("stack", stack);
    const search = params.toString();
    router.push(search ? `/explore?${search}` : "/explore");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Label htmlFor="q">Search skills</Label>
      <div className="flex gap-3">
        <Input key={q} id="q" name="q" type="search" defaultValue={q} placeholder="Try “code review” or “auth”" />
        <Button type="submit">Search</Button>
      </div>
    </form>
  );
}
