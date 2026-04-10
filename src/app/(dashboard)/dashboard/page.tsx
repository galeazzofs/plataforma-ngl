import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard-stats'
import type { Client, ContentItem } from '@/types'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: clients }, { data: allItems }] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase.from('content_items').select('*').order('scheduled_date', { ascending: true }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Visao geral da producao</p>
      </div>
      <DashboardStats
        clients={(clients ?? []) as Client[]}
        items={(allItems ?? []) as ContentItem[]}
      />
    </div>
  )
}
