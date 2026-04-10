import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ContentItem } from '@/types'
import { formatDateShort, isOverdue, cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface KanbanCardProps {
  item: ContentItem
}

const effortColors: Record<number, string> = {
  1: 'bg-emerald-500/10 text-emerald-400',
  2: 'bg-amber-500/10 text-amber-400',
  3: 'bg-red-500/10 text-red-400',
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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-card border border-border/50 rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-colors duration-150',
        isDragging && 'opacity-50',
        overdue && 'border-red-500/30 shadow-[0_0_12px_-3px_rgba(239,68,68,0.15)]'
      )}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-tight">{item.title}</p>
          {overdue && <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />}
        </div>

        {item.concept && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.concept}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="bg-secondary text-muted-foreground rounded-full text-xs px-2 py-0.5">
              {item.format}
            </span>
            <span className={cn('rounded-full text-xs px-2 py-0.5 font-medium', effortColors[item.effort])}>
              E{item.effort}
            </span>
          </div>
          <span className="text-xs text-muted-foreground/60">{formatDateShort(item.scheduled_date)}</span>
        </div>
      </div>
    </div>
  )
}
