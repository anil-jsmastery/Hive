"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@/components/skill/markdown";
import { PaywallDialog } from "@/components/billing/paywall-dialog";
import { publishSkill, type PublishField, type PublishState } from "@/app/publish/actions";
import type { Variant } from "@/lib/analytics/events";
import { STACKS } from "@/lib/constants";
import { slugify } from "@/lib/slug";

const DRAFT_KEY = "hive:publish-draft";

type Draft = {
  title: string;
  description: string;
  stack: string;
  owner: string;
  tags: string;
  content: string;
  visibility: string;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function PublishForm({
  variant,
  handle,
  teamName,
}: {
  variant: Variant;
  handle: string;
  teamName: string | null;
}) {
  const [state, formAction, pending] = useActionState<PublishState, FormData>(publishSkill.bind(null, variant), {});
  const [, startTransition] = useTransition();
  // Controlled fields keep their values after a failed submit.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stack, setStack] = useState("");
  const [owner, setOwner] = useState("personal");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [content, setContent] = useState("");
  // The paywall opens for every submit that returns one, until that result is dismissed.
  const [dismissed, setDismissed] = useState<PublishState | null>(null);
  const paywallOpen = Boolean(state.paywall) && dismissed !== state;
  const errors: Partial<Record<PublishField, string>> = state.errors ?? {};
  const asTeam = Boolean(teamName) && owner === "team";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const draftChecked = useRef(false);

  // After an upgrade from the paywall, bring back the draft saved by "See plans".
  // The user still submits it themselves.
  useEffect(() => {
    if (draftChecked.current) return;
    draftChecked.current = true;
    const upgraded = searchParams.get("upgraded") === "1";
    // A draft left behind without upgraded=1 is dropped.
    let draft: Draft | null = null;
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      sessionStorage.removeItem(DRAFT_KEY);
      if (saved && upgraded) draft = JSON.parse(saved) as Draft;
    } catch {
      draft = null;
    }
    if (!upgraded) return;
    if (draft) {
      // sessionStorage only exists in the browser, so the draft can only be applied after hydration.
      /* eslint-disable react-hooks/set-state-in-effect */
      setTitle(draft.title);
      setDescription(draft.description);
      setStack(draft.stack);
      setOwner(draft.owner);
      setTags(draft.tags);
      setContent(draft.content);
      setVisibility(draft.visibility);
      /* eslint-enable react-hooks/set-state-in-effect */
      toast("Your plan is active. Your draft is back, ready to publish.");
    }
    const params = new URLSearchParams(window.location.search);
    params.delete("upgraded");
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  function saveDraft() {
    const draft: Draft = { title, description, stack, owner, tags, content, visibility: "private" };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Storage can be unavailable (private mode). The upgrade still works without the draft.
    }
  }

  return (
    <form
      // Submitting through onSubmit skips React's automatic form reset, which would also
      // reset the Radix Selects and RadioGroup (Publish as, Stack, Visibility).
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="space-y-8"
    >
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Publish a skill</h1>

      {state.formError ? (
        <Alert variant="destructive">
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="publish-title">Title</Label>
        <Input
          id="publish-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={errors.title ? true : undefined}
        />
        <FieldError message={errors.title} />
        <p className="text-sm text-muted-foreground">Your skill will live at /s/{slugify(title) || "your-skill"}</p>
      </div>

      {teamName ? (
        <div className="space-y-2">
          <Label htmlFor="publish-owner">Publish as</Label>
          <Select name="owner" value={owner} onValueChange={setOwner}>
            <SelectTrigger id="publish-owner" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal (@{handle})</SelectItem>
              <SelectItem value="team">{teamName}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Team skills show your team’s name and live on its team page.</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="publish-description">Description</Label>
        <Input
          id="publish-description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={errors.description ? true : undefined}
        />
        <FieldError message={errors.description} />
        <p className="text-sm text-muted-foreground">One sentence on what the skill does.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="publish-stack">Stack</Label>
        <Select name="stack" value={stack} onValueChange={setStack}>
          <SelectTrigger id="publish-stack" className="w-full sm:w-64" aria-invalid={errors.stack ? true : undefined}>
            <SelectValue placeholder="Choose a stack" />
          </SelectTrigger>
          <SelectContent>
            {STACKS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.stack} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="publish-tags">Tags</Label>
        <Input
          id="publish-tags"
          name="tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          aria-invalid={errors.tags ? true : undefined}
        />
        <FieldError message={errors.tags} />
        <p className="text-sm text-muted-foreground">Comma-separated, up to 5. Example: auth, nextjs</p>
      </div>

      <div className="space-y-2">
        <Label id="publish-visibility">Visibility</Label>
        <RadioGroup name="visibility" value={visibility} onValueChange={setVisibility} aria-labelledby="publish-visibility">
          <div className="flex items-start gap-3">
            <RadioGroupItem id="publish-visibility-public" value="public" className="mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="publish-visibility-public">Public</Label>
              <p className="text-sm text-muted-foreground">Anyone can find and install it.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RadioGroupItem id="publish-visibility-private" value="private" className="mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="publish-visibility-private">
                <Lock className="size-4" />
                Private
              </Label>
              <p className="text-sm text-muted-foreground">
                {asTeam ? "Only your team can see it. Needs Team." : "Only you can see it. Needs Pro."}
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="publish-content">Skill content</Label>
        {/* The Write tab unmounts while Preview is open, so the value is posted from here. */}
        <input type="hidden" name="content" value={content} />
        <Tabs defaultValue="write">
          <TabsList>
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write">
            <Textarea
              id="publish-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={"# Skill name\nWhen should an agent use this skill?"}
              className="min-h-[320px] font-mono"
              aria-invalid={errors.content ? true : undefined}
            />
          </TabsContent>
          <TabsContent value="preview">
            <div className="min-h-[320px] rounded-md border bg-card p-4">
              <Markdown content={content} />
            </div>
          </TabsContent>
        </Tabs>
        <FieldError message={errors.content} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish skill"}
      </Button>

      <PaywallDialog
        feature={state.paywall ?? null}
        open={paywallOpen}
        onClose={() => setDismissed(state)}
        onSeePlans={saveDraft}
        onPublishPublic={() => {
          setVisibility("public");
          setDismissed(state);
        }}
      />
    </form>
  );
}
