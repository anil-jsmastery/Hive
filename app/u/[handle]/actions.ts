'use server';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';

export async function toggleFollow(handle: string): Promise<{ needsAuth: true } | { following: boolean } | { error: string }> {
  const me = await getCurrentProfile();
  if (!me) return { needsAuth: true };
  const supabase = await createServerSupabase();
  const { data: them } = await supabase.from('profiles').select('id').eq('handle', handle).maybeSingle();
  if (!them || them.id === me.id) return { error: 'You can’t follow this profile.' };

  const inserted = await supabase.from('follows').insert({ follower_id: me.id, following_id: them.id });
  let following = true;
  if (inserted.error) {
    if (inserted.error.code !== '23505') return { error: 'Could not update follow.' };
    await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', them.id);
    following = false;
  }
  revalidatePath(`/u/${handle}`);
  return { following };
}
