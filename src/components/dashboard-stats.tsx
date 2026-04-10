import { Badge } from '@/components/ui/badge'
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
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500/10 rounded-xl p-2.5">
              <Video className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{items.length}</p>
              <p className="text-sm text-muted-foreground">Total de videos</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 rounded-xl p-2.5">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">
                {statusCounts.to_record + statusCounts.editing}
              </p>
              <p className="text-sm text-muted-foreground">Em producao</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 rounded-xl p-2.5">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{statusCounts.published}</p>
              <p className="text-sm text-muted-foreground">Publicados</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="bg-red-500/10 rounded-xl p-2.5">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{overdueItems.length}</p>
              <p className="text-sm text-muted-foreground">Atrasados</p>
            </div>
          </div>
        </div>
      </div>

      {overdueItems.length > 0 && (
        <div className="bg-card border border-red-500/20 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Videos Atrasados
            </h3>
          </div>
          <div className="p-5 space-y-1">
            {overdueItems.slice(0, 10).map((item) => {
              const client = clients.find((c) => c.id === item.client_id)
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors duration-150"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {client?.name} — Data: {formatDate(item.scheduled_date)}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                    {KANBAN_COLUMNS.find((c) => c.key === item.kanban_status)?.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h3 className="text-base font-semibold text-foreground">Clientes</h3>
        </div>
        <div className="p-5 space-y-1">
          {clients.map((client) => {
            const clientItems = items.filter((i) => i.client_id === client.id)
            const clientOverdue = clientItems.filter((i) =>
              isOverdue(i.scheduled_date, i.kanban_status)
            ).length
            return (
              <Link
                key={client.id}
                href={`/kanban/${client.id}`}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors duration-150"
              >
                <div>
                  <p className="font-medium text-foreground">{client.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{client.niche}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-border/50 text-muted-foreground text-xs">
                    {clientItems.length} videos
                  </Badge>
                  {clientOverdue > 0 && (
                    <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                      {clientOverdue} atrasados
                    </Badge>
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
