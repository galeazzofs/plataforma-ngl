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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{typedClient.name}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${id}/trends`}
            className="inline-flex items-center gap-2 border border-border/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground text-sm font-medium rounded-lg px-3.5 py-2 transition-all duration-150"
          >
            <TrendingUp className="h-4 w-4" />
            Trends
          </Link>
          <Link
            href={`/clients/${id}/calendar`}
            className="inline-flex items-center gap-2 border border-border/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground text-sm font-medium rounded-lg px-3.5 py-2 transition-all duration-150"
          >
            <CalendarDays className="h-4 w-4" />
            Calendario
          </Link>
          <form action={deleteWithId}>
            <button
              type="submit"
              className="inline-flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg p-2 transition-colors duration-150"
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
