'use server';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { setPersonProperties } from '@/lib/analytics/server';
import { STACKS, type Stack } from '@/lib/constants';

export async function saveStack(stack: Stack) {
  if (!STACKS.includes(stack)) throw new Error('Unknown stack');
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('profiles').update({ stack }).eq('id', userId);
  if (error) throw new Error(error.message);

  await setPersonProperties(userId, { stack });
  redirect('/explore');
}
