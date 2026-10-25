import 'server-only';
import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { trackServer } from '@/lib/analytics/server';

export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  stack: string | null;
};

const FIELDS = 'id, handle, display_name, avatar_url, stack';

// The signed-in user's profile. Created on their first signed-in request, which is
// also the only place user_signed_up is sent.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = await createServerSupabase();

  const { data: existing } = await supabase.from('profiles').select(FIELDS).eq('id', userId).maybeSingle();
  if (existing) return existing;

  const user = await currentUser();
  if (!user?.username) return null; // Username is required in the Clerk dashboard settings.

  const base = { id: userId, display_name: user.fullName || user.username, avatar_url: user.imageUrl };
  let result = await supabase.from('profiles').insert({ ...base, handle: user.username }).select(FIELDS).single();
  if (result.error) {
    // Either another request created the profile first, or the handle belongs to a seed author.
    const { data: raced } = await supabase.from('profiles').select(FIELDS).eq('id', userId).maybeSingle();
    if (raced) return raced;
    const fallback = `${user.username}-${userId.slice(-6).toLowerCase()}`;
    result = await supabase.from('profiles').insert({ ...base, handle: fallback }).select(FIELDS).single();
    if (result.error) return null;
  }

  await trackServer(userId, 'user_signed_up', { method: 'email' });
  return result.data;
});
