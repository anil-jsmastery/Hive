// The tracking plan as code. Adding an event here requires a row in TRACKING_PLAN.md.
export type Variant = 'control' | 'test';

export type EventProps = {
  landing_cta_clicked: { cta: 'hero' };
  user_signed_up: { method: 'email' };
  search_performed: { query: string; stack: string; result_count: number };
  search_result_opened: { query: string; rank: number; slug: string };
  skill_viewed: { slug: string; stack: string; author_handle: string; visibility: 'public' | 'private' };
  share_link_opened: { slug: string };
  skill_installed: { slug: string; stack: string };
  skill_starred: { slug: string };
  skill_forked: { slug: string; fork_slug: string };
  comment_posted: { slug: string; length: number };
  publish_started: { variant: Variant };
  skill_published: {
    slug: string;
    stack: string;
    tag_count: number;
    content_length: number;
    visibility: 'public' | 'private';
    owner: 'personal' | 'team';
    variant: Variant;
  };
  notification_clicked: { type: 'fork' | 'comment' | 'follow' };
  paywall_shown: { feature: 'private_skills' | 'team_private_skills' };
  pricing_viewed: { tab: 'personal' | 'team' };
  organization_created: { slug: string };
  subscription_started: { plan: string; payer: 'user' | 'organization' };
  subscription_canceled: { plan: string; payer: 'user' | 'organization' };
};

export type EventName = keyof EventProps;
