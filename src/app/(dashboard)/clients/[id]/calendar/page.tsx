import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CalendarGrid } from '@/components/calendar-grid'
import type { ContentItem } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const { data: calendar } = await supabase
    .from('content_calendars')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let items: ContentItem[] = []
  if (calendar) {
    const { data } = await supabase
      .from('content_items')
      .select('*')
      .eq('calendar_id', calendar.id)
      .order('day_number', { ascending: true })
      .order('kanban_order', { ascending: true })

    items = (data ?? []) as ContentItem[]
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Calendario — {client.name}</h1>
        <p className="text-slate-500 mt-1">Geracao e edicao de conteudo com IA</p>
      </div>
      <CalendarGrid
        clientId={id}
        calendarId={calendar?.id ?? null}
        initialItems={items}
        status={calendar?.status ?? null}
      />
    </div>
  )
}
