import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { KanbanStatus } from '@/types'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId, newStatus, newOrder } = await request.json() as {
      itemId: string
      newStatus: KanbanStatus
      newOrder: number
    }

    const { error } = await supabase
      .from('content_items')
      .update({
        kanban_status: newStatus,
        kanban_order: newOrder,
      })
      .eq('id', itemId)

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { itemId, newStatus, newOrder }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to move item' }, { status: 500 })
  }
}
