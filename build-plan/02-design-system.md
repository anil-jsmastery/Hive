# Step 02: Design system and app shell

| | |
| --- | --- |
| Starts from | `step-01` |
| Ends at | `step-02` |
| What you'll learn | A small, consistent design system |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 01 is committed and tagged `step-01`. If this step goes wrong, go back with `git reset --hard step-01` and run it again in a new conversation.

**Goal:** fonts, colors, the shared shell, and the small shared components, all from `build-plan/DESIGN.md`.

## Files

| File | Contains |
| --- | --- |
| `app/globals.css` | Keep what `shadcn init` generated. Replace the `:root` values with the tokens in DESIGN.md (VERBATIM) and delete the `.dark` block. Add the lines below |
| `app/layout.tsx` | Fonts on `<html>`, body classes, header, main container, footer, `<Toaster position="bottom-right" />` |
| `components/hive-mark.tsx` | VERBATIM below |
| `components/site-header.tsx` | Signed-out version only in this step (Step 06 wires in Clerk) |
| `components/site-footer.tsx` | Top border, `text-sm text-muted-foreground`: "Hive is a demo app built for a JS Mastery course." |
| `components/empty-state.tsx` | As described in DESIGN.md |
| `app/not-found.tsx` | Heading "Page not found", text "This page doesn’t exist. Head back to Explore to find a skill.", button "Explore skills" linking to `/explore` |

**Add to `app/globals.css`**, **VERBATIM**, right after the existing `@import "tailwindcss";` line:

```css
@import '@clerk/ui/themes/shadcn.css';
@plugin "@tailwindcss/typography";
```

Then, inside the existing `@theme inline` block, map the fonts:

```css
  --font-display: var(--font-display);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
```

And at the end of the file:

```css
h1, h2, h3 { font-family: var(--font-display); }
```

**`app/layout.tsx` fonts:** Bricolage Grotesque (600, 700, variable `--font-display`), Instrument Sans (400, 500, 600, variable `--font-sans`), JetBrains Mono (400, variable `--font-mono`), all from `next/font/google` with `subsets: ['latin']`. Body: `bg-background text-foreground font-sans antialiased`. Main: `<main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">`. Metadata title: "Hive · Skills for AI agents".

**`components/hive-mark.tsx`, VERBATIM:**

```tsx
export function HiveMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M12 2 L20.66 7 V17 L12 22 L3.34 17 V7 Z" fill="currentColor" />
    </svg>
  );
}
```

**`components/site-header.tsx` in this step:** sticky, `h-16`, white background, bottom border, inside the page container.

- **Left:** a link to `/` with `HiveMark` (`size-6 text-primary`) and the word "Hive" (`font-display font-bold`).
- **Middle:** links "Explore" (`/explore`) and "Publish" (`/publish`). Below 640px, these become icon buttons (lucide `Search`, `Plus`) with `aria-label`s "Explore" and "Publish". Step 16 adds "Pricing".
- **Right:** a primary button "Sign in" linking to `/sign-in`.

## Checks

- `npm run build` passes.
- At 1280px and 390px wide, the header fits with no horizontal scroll.
- Keyboard focus is visible on every link and button.
- `/does-not-exist` shows the not-found page with the exact text.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 02
- Design tokens, fonts and Clerk's shadcn theme CSS are in app/globals.css. Light theme only.
- Shared components: HiveMark, SiteHeader (signed-out only), SiteFooter, EmptyState, not-found page.
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 02: design system` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-02`.

**Next:** `03-database.md`
