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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-white/90">Clientes</h1>
          <span className="text-sm text-white/30">
            {count} {count === 1 ? 'cliente' : 'clientes'}
          </span>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-semibold px-5 py-2.5 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Link>
      </div>

      {/* Empty state */}
      {!clients?.length ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-white/[0.04] border border-white/[0.06] p-4 mb-5">
            <Users className="h-7 w-7 text-white/20" />
          </div>
          <p className="text-white/40 text-sm mb-6">Nenhum cliente cadastrado ainda</p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-semibold px-5 py-2.5 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Adicionar primeiro cliente
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(clients as Client[]).map((client, i) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <div
                className={`gradient-border bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 cursor-pointer hover:border-white/[0.12] transition-all duration-300 group animate-fade-up stagger-${i + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-white/90 text-base group-hover:text-white transition-colors duration-200">
                    {client.name}
                  </h3>
                  <span className="bg-violet-500/10 text-violet-300 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
                    {client.niche}
                  </span>
                </div>

                {client.target_audience && (
                  <p className="text-sm text-white/40 line-clamp-2 mt-3">
                    {client.target_audience}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {Object.entries(client.social_networks || {})
                    .filter(([, active]) => active)
                    .map(([network]) => (
                      <span
                        key={network}
                        className="bg-white/[0.06] text-white/40 rounded-full px-2.5 py-0.5 text-xs capitalize"
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
