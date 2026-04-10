import { createServerSupabaseClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban-board'
import type { ContentItem } from '@/types'

export default async function KanbanPage() {
  const supabase = await createServerSupabaseClient()

  const { data: items } = await supabase
    .from('content_items')
    .select('*')
    .order('kanban_order', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Kanban</h1>
        <p className="text-slate-500 mt-1">Quadro de producao — todos os clientes</p>
      </div>
      <KanbanBoard initialItems={(items ?? []) as ContentItem[]} />
    </div>
  )
}
