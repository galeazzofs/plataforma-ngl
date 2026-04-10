import { AlertTriangle, Video, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import type { ContentItem, Client, KanbanStatus } from '@/types'
import { formatDate, isOverdue } from '@/lib/utils'
import { KANBAN_COLUMNS } from '@/types'

interface DashboardStatsProps {
  clients: Client[]
  items: ContentItem[]
}

export function DashboardStats({ clients, items }: DashboardStatsProps) {
  const statusCounts = KANBAN_COLUMNS.reduce<Record<KanbanStatus, number>>(
    (acc, col) => {
      acc[col.key] = items.filter((i) => i.kanban_status === col.key).length
      return acc
    },
    {} as Record<KanbanStatus, number>
  )

  const overdueItems = items.filter((i) => isOverdue(i.scheduled_date, i.kanban_status))

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 animate-fade-up">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-violet-500/10">
            <Video className="h-5 w-5 text-violet-400" />
          </div>
          <p className="text-3xl font-extrabold text-white/95 mt-4">{items.length}</p>
          <p className="text-sm text-white/40 mt-1">Total de videos</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 animate-fade-up stagger-1">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-amber-500/10">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white/95 mt-4">
            {statusCounts.to_record + statusCounts.editing}
          </p>
          <p className="text-sm text-white/40 mt-1">Em producao</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 animate-fade-up stagger-2">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-emerald-500/10">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white/95 mt-4">{statusCounts.published}</p>
          <p className="text-sm text-white/40 mt-1">Publicados</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 animate-fade-up stagger-3">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-rose-500/10">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-white/95 mt-4">{overdueItems.length}</p>
          <p className="text-sm text-white/40 mt-1">Atrasados</p>
        </div>
      </div>

      {overdueItems.length > 0 && (
        <div className="bg-white/[0.03] border border-rose-500/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <h3 className="text-white/90 font-semibold">Videos Atrasados</h3>
          </div>
          <div className="px-3 pb-3 space-y-0.5">
            {overdueItems.slice(0, 10).map((item) => {
              const client = clients.find((c) => c.id === item.client_id)
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between hover:bg-white/[0.03] rounded-xl px-4 py-3 transition-all duration-200"
                >
                  <div>
                    <p className="text-sm font-medium text-white/90">{item.title}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {client?.name} — Data: {formatDate(item.scheduled_date)}
                    </p>
                  </div>
                  <span className="bg-rose-500/10 text-rose-300 rounded-full px-3 py-1 text-xs font-medium">
                    {KANBAN_COLUMNS.find((c) => c.key === item.kanban_status)?.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white/90">Clientes</h3>
        </div>
        <div className="px-3 pb-3 pt-1 space-y-0.5">
          {clients.map((client) => {
            const clientItems = items.filter((i) => i.client_id === client.id)
            const clientOverdue = clientItems.filter((i) =>
              isOverdue(i.scheduled_date, i.kanban_status)
            ).length
            return (
              <Link
                key={client.id}
                href={`/kanban/${client.id}`}
                className="flex items-center justify-between hover:bg-white/[0.03] rounded-xl px-4 py-3 transition-all duration-200"
              >
                <div>
                  <p className="font-semibold text-white/90">{client.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">{client.niche}</p>
                </div>
                <div className="flex gap-2">
                  <span className="bg-white/[0.06] text-white/40 rounded-full px-3 py-1 text-xs font-medium">
                    {clientItems.length} videos
                  </span>
                  {clientOverdue > 0 && (
                    <span className="bg-rose-500/10 text-rose-300 rounded-full px-3 py-1 text-xs font-medium">
                      {clientOverdue} atrasados
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
