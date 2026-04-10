import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Plus, Users } from 'lucide-react'
import type { Client } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  const count = clients?.length ?? 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {count} {count === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors duration-150"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Link>
      </div>

      {/* Empty state */}
      {!clients?.length ? (
        <div className="bg-card border border-border/50 rounded-xl flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-secondary p-3 mb-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado ainda</p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors duration-150"
          >
            <Plus className="h-4 w-4" />
            Adicionar primeiro cliente
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(clients as Client[]).map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <div className="bg-card border border-border/50 rounded-xl p-5 hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground group-hover:text-indigo-400 transition-colors duration-200">
                    {client.name}
                  </h3>
                  <span className="bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-full px-2.5 py-0.5 whitespace-nowrap">
                    {client.niche}
                  </span>
                </div>

                {client.target_audience && (
                  <p className="text-sm text-muted-foreground mt-2.5 line-clamp-2">
                    {client.target_audience}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {Object.entries(client.social_networks || {})
                    .filter(([, active]) => active)
                    .map(([network]) => (
                      <span
                        key={network}
                        className="bg-secondary text-muted-foreground text-xs rounded-full px-2.5 py-0.5 capitalize"
                      >
                        {network}
                      </span>
                    ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
