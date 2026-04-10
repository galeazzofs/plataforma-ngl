import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TrendList } from '@/components/trend-list'
import type { Trend } from '@/types'

export const dynamic = 'force-dynamic'

export default async function TrendsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, niche')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const { data: trends } = await supabase
    .from('trends')
    .select('*')
    .eq('niche', client.niche)
    .order('collected_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Trends — {client.name}</h1>
        <p className="text-slate-500 mt-1">Nicho: {client.niche}</p>
      </div>
      <TrendList clientId={id} initialTrends={(trends ?? []) as Trend[]} />
    </div>
  )
}
