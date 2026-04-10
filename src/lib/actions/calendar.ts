'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function commitCalendar(calendarId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('content_calendars')
    .update({ status: 'committed' })
    .eq('id', calendarId)

  if (error) throw new Error(error.message)

  revalidatePath('/kanban')
}
