import 'server-only';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { identifyOrganization } from '@/lib/analytics/server';

// Makes sure the active Clerk organization has a row in Supabase.
// Returns it, or null when no team is active.
export async function ensureOrganization() {
  const { orgId } = await auth();
  if (!orgId) return null;
  const supabase = await createServerSupabase();
  const { data: existing } = await supabase.from('organizations').select('id, slug, name').eq('id', orgId).maybeSingle();
  if (existing) return existing;

  const org = await (await clerkClient()).organizations.getOrganization({ organizationId: orgId });
  const row = { id: org.id, slug: org.slug ?? org.id, name: org.name, image_url: org.imageUrl };
  const { data, error } = await supabase.from('organizations').upsert(row).select('id, slug, name').single();
  if (error) return null;
  await identifyOrganization(org.id, { name: org.name, slug: row.slug });
  return data;
}
