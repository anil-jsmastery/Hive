import { verifyWebhook } from '@clerk/nextjs/webhooks';
import type { NextRequest } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { identifyOrganization, trackServer } from '@/lib/analytics/server';

// Default free plans also send subscriptionItem events (for every new user and team).
const FREE_PLANS = new Set(['free_user', 'free_org']);

// Field paths for Clerk's subscriptionItem payload. If your events report plan "unknown",
// compare with one real test event in Clerk Dashboard → Webhooks → your endpoint → Logs.
function readSubscriptionItem(data: unknown) {
  const d = data as {
    plan?: { slug?: string; key?: string };
    payer?: { user_id?: string | null; organization_id?: string | null };
  };
  return {
    plan: String(d.plan?.slug ?? d.plan?.key ?? 'unknown'),
    userId: d.payer?.user_id ?? null,
    orgId: d.payer?.organization_id ?? null,
  };
}

export async function POST(req: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (evt.type === 'organization.created') {
    const org = evt.data;
    const slug = org.slug ?? org.id;
    await createAdminSupabase()
      .from('organizations')
      .upsert({ id: org.id, slug, name: org.name, image_url: org.image_url ?? null });
    await identifyOrganization(org.id, { name: org.name, slug });
    if (org.created_by) await trackServer(org.created_by, 'organization_created', { slug }, org.id);
  }

  if (evt.type === 'subscriptionItem.active' || evt.type === 'subscriptionItem.canceled') {
    const item = readSubscriptionItem(evt.data);
    if (!FREE_PLANS.has(item.plan) && (item.userId || item.orgId)) {
      const event = evt.type === 'subscriptionItem.active' ? 'subscription_started' : 'subscription_canceled';
      await trackServer(
        item.userId ?? `org_${item.orgId}`,
        event,
        { plan: item.plan, payer: item.orgId ? 'organization' : 'user' },
        item.orgId,
      );
    }
  }

  return new Response('ok', { status: 200 });
}
