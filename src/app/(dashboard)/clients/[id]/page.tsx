import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClientForm } from '@/components/client-form'
import { updateClient, deleteClient } from '@/lib/actions/clients'
import { Button } from '@/components/ui/button'
import { CalendarDays, TrendingUp, Trash2 } from 'lucide-react'
import type { Client } from '@/types'

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{typedClient.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${id}/trends`}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Trends
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${id}/calendar`}>
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendario
            </Link>
          </Button>
          <form action={deleteWithId}>
            <Button variant="destructive" size="icon" type="submit">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-2xl">
        <ClientForm action={updateWithId} client={typedClient} />
      </div>
    </div>
  )
}
