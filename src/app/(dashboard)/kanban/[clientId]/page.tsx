import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { KanbanBoard } from '@/components/kanban-board'
import type { ContentItem } from '@/types'

export default async function ClientKanbanPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single()

  if (!client) notFound()

  const { data: items } = await supabase
    .from('content_items')
    .select('*')
    .eq('client_id', clientId)
    .order('kanban_order', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Kanban — {client.name}</h1>
        <p className="text-slate-500 mt-1">Quadro de producao</p>
      </div>
      <KanbanBoard initialItems={(items ?? []) as ContentItem[]} clientFilter={clientId} />
    </div>
  )
}
