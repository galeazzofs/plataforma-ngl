import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ContentItem } from '@/types'
import { formatDateShort, isOverdue, cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface KanbanCardProps {
  item: ContentItem
}

const effortColors: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-red-100 text-red-700',
}

export function KanbanCard({ item }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { item } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const overdue = isOverdue(item.scheduled_date, item.kanban_status)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
        overdue && 'border-red-300'
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm text-slate-900 leading-tight">{item.title}</p>
          {overdue && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-slate-500 line-clamp-2">{item.concept}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">{item.format}</Badge>
            <Badge className={`text-xs ${effortColors[item.effort]}`}>E{item.effort}</Badge>
          </div>
          <span className="text-xs text-slate-400">{formatDateShort(item.scheduled_date)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
