'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateContentItem(
  id: string,
  updates: Record<string, unknown>
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('content_items')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/kanban')
}

export async function deleteContentItem(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
