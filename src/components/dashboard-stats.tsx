import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Video className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{items.length}</p>
                <p className="text-sm text-slate-500">Total de videos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {statusCounts.to_record + statusCounts.editing}
                </p>
                <p className="text-sm text-slate-500">Em producao</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{statusCounts.published}</p>
                <p className="text-sm text-slate-500">Publicados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{overdueItems.length}</p>
                <p className="text-sm text-slate-500">Atrasados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {overdueItems.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Videos Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueItems.slice(0, 10).map((item) => {
                const client = clients.find((c) => c.id === item.client_id)
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {client?.name} — Data: {formatDate(item.scheduled_date)}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {KANBAN_COLUMNS.find((c) => c.key === item.kanban_status)?.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clients.map((client) => {
              const clientItems = items.filter((i) => i.client_id === client.id)
              const clientOverdue = clientItems.filter((i) =>
                isOverdue(i.scheduled_date, i.kanban_status)
              ).length
              return (
                <Link
                  key={client.id}
                  href={`/kanban/${client.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{client.name}</p>
                    <p className="text-xs text-slate-500">{client.niche}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{clientItems.length} videos</Badge>
                    {clientOverdue > 0 && (
                      <Badge variant="destructive">{clientOverdue} atrasados</Badge>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
