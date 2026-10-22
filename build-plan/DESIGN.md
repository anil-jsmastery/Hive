# Hive design system

Every page and component follows this file. If a step doesn't specify something visual, the answer is here. If it isn't here either, use the plainest shadcn/ui default and don't invent a new style.

## Direction

Hive's world is the beehive: cells, honey, a busy colony of builders. That appears in exactly two places: the honey-colored hexagon logo, and the small hexagon markers in the live activity rail. Everything else is quiet and functional: a cool paper-white background, ink-colored text, one honey accent for primary actions and star counts. Light theme only.

## Color tokens (VERBATIM, in `app/globals.css` `:root`)

```css
:root {
  --radius: 0.625rem;
  --background: #F6F7F9;
  --foreground: #161A23;
  --card: #FFFFFF;
  --card-foreground: #161A23;
  --popover: #FFFFFF;
  --popover-foreground: #161A23;
  --primary: #E3A21A;
  --primary-foreground: #241A05;
  --secondary: #EEF0F4;
  --secondary-foreground: #161A23;
  --muted: #EEF0F4;
  --muted-foreground: #5B6272;
  --accent: #FDF3D8;
  --accent-foreground: #5A3E05;
  --destructive: #C7372F;
  --border: #DDE1E8;
  --input: #DDE1E8;
  --ring: #E3A21A;
}
```

| Token | Used for |
| --- | --- |
| `primary` | Primary buttons, active filter pill, star icon, unread badge |
| `accent` | Unread notification rows, the paywall dialog's highlight box |
| `muted-foreground` | Secondary text, timestamps, help text |
| `destructive` | Field errors only |

No other colors, gradients or shadows. Cards use a border, never a shadow.

## Typography

| Role | Font (next/font/google) | Weights | Variable | Tailwind |
| --- | --- | --- | --- | --- |
| Headings | Bricolage Grotesque | 600, 700 | `--font-display` | `font-display` |
| Body and UI | Instrument Sans | 400, 500, 600 | `--font-sans` | `font-sans` |
| Commands and code | JetBrains Mono | 400 | `--font-mono` | `font-mono` |

| Style | Classes |
| --- | --- |
| Page title (H1) | `font-display text-4xl sm:text-5xl font-bold tracking-tight` |
| Section title (H2) | `font-display text-2xl font-semibold` |
| Card title | `text-lg font-semibold` |
| Body | `text-base leading-relaxed` |
| Small and meta | `text-sm text-muted-foreground` |

Text blocks stay under about 70 characters wide (`max-w-prose`).

## Layout and spacing

- Page container: `mx-auto max-w-5xl px-4 sm:px-6`, main area `py-10`.
- Vertical rhythm: `space-y-8` between page sections, `space-y-3` inside a section, `gap-3` in card lists.
- Header: sticky, 64px tall (`h-16`), white background, bottom border.
- Breakpoint: below 640px (`sm`), header links become icon buttons; two-column layouts stack.
- Radius: cards `rounded-xl`, inputs and buttons `rounded-md` (shadcn default), badges and pills `rounded-full`.

## Components (shadcn/ui, installed in Step 00)

Radix base, Hive's preset `bIkeymG`. Use the Radix API (`asChild` for custom triggers and links), never Base UI's `render` prop. Installed: `button`, `input`, `textarea`, `label`, `card`, `badge`, `tabs`, `select`, `radio-group`, `dropdown-menu`, `avatar`, `separator`, `dialog`, `alert`, `sonner`. No others.

| Need | Use |
| --- | --- |
| Primary action | `<Button>` (default variant) |
| Secondary action | `<Button variant="outline">` |
| Low-emphasis action | `<Button variant="ghost">` |
| Stack | `<Badge variant="secondary">` |
| Tag | `<Badge variant="outline">` |
| Private skill | `<Badge variant="outline">` with a lucide `Lock` icon and text "Private" |
| Team owner | `<Badge variant="secondary">` with a lucide `Users` icon and the team name |
| Toasts | `sonner`, bottom-right |
| Icons | `lucide-react` only, 16px in text, 20px in icon buttons |

## Shared components (built in the steps)

| Component | File | Built in |
| --- | --- | --- |
| `HiveMark` | `components/hive-mark.tsx` | Step 02 |
| `SiteHeader`, `SiteFooter` | `components/site-header.tsx`, `components/site-footer.tsx` | Step 02, wired in 06 |
| `SkillCard` | `components/explore/skill-card.tsx` | Step 08 |
| `EmptyState` | `components/empty-state.tsx` | Step 02 |
| `PaywallDialog` | `components/billing/paywall-dialog.tsx` | Step 11 |

`EmptyState` props: `title`, `body`, optional `action` (a button or link). Layout: a dashed-border card (`border-dashed`), centered text, `py-10`.

## Clerk components

- Clerk's shadcn theme, so Clerk's UI uses our tokens: `import { shadcn } from '@clerk/ui/themes'` passed as `appearance={{ theme: shadcn }}` on `<ClerkProvider>`, plus `@import '@clerk/ui/themes/shadcn.css';` in `globals.css` (Step 02).
- Clerk components used: `<SignIn />`, `<SignUp />`, `<UserButton />`, `<OrganizationSwitcher />`, `<PricingTable />`, `<Show>`, `<SignInButton>`. No others.
- Sign-in and sign-up pages: centered in the container, `py-16`, with no extra heading (Clerk's card has its own).

## States

| State | Pattern |
| --- | --- |
| Empty | `EmptyState` with the exact text from the step |
| Loading | No spinners in lists. Buttons show their pending label (for example "Publishing…") and are disabled |
| Field error | Text in `text-sm text-destructive` directly under the field |
| Form error | `<Alert variant="destructive">` at the top of the form |
| Not found | `app/not-found.tsx` (Step 02) |

## UI text rules

- Sentence case everywhere: "Publish a skill", not "Publish A Skill".
- Buttons say what they do: "Publish skill", "Post comment", "See plans".
- Use the typographic apostrophe (’) and curly quotes (“ ”) in UI text.
- Never use a middle dot (·) to join metadata. Use separate badges or separate elements. The only exception is the browser tab title.
- No exclamation marks, except the publish success toast "Published".

## Accessibility

- Every input has a visible `<Label>`. Icon-only buttons have an `aria-label` matching the text they replace.
- Focus rings stay visible (shadcn default, honey `--ring`).
- Text contrast meets WCAG AA. Never put text on `--primary` other than `--primary-foreground`.
