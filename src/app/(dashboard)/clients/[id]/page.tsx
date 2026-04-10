import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClientForm } from '@/components/client-form'
import { updateClient, deleteClient } from '@/lib/actions/clients'
import { CalendarDays, TrendingUp, Trash2 } from 'lucide-react'
import type { Client } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const typedClient = client as Client
  const updateWithId = updateClient.bind(null, id)
  const deleteWithId = deleteClient.bind(null, id)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white/90">{typedClient.name}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${id}/trends`}
            className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white/90 hover:bg-white/[0.06] rounded-xl text-sm font-medium px-4 py-2.5 transition-all duration-200"
          >
            <TrendingUp className="h-4 w-4" />
            Trends
          </Link>
          <Link
            href={`/clients/${id}/calendar`}
            className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white/90 hover:bg-white/[0.06] rounded-xl text-sm font-medium px-4 py-2.5 transition-all duration-200"
          >
            <CalendarDays className="h-4 w-4" />
            Calendario
          </Link>
          <form action={deleteWithId}>
            <button
              type="submit"
              className="inline-flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-xl p-2.5 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <ClientForm action={updateWithId} client={typedClient} />
      </div>
    </div>
  )
}
