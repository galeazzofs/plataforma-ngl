import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ContentItem } from '@/types'
import { formatDateShort, isOverdue, cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface KanbanCardProps {
  item: ContentItem
}

const effortColors: Record<number, string> = {
  1: 'bg-emerald-500/10 text-emerald-300',
  2: 'bg-amber-500/10 text-amber-300',
  3: 'bg-rose-500/10 text-rose-300',
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
        'bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-grab active:cursor-grabbing transition-all duration-200',
        isDragging && 'opacity-40 scale-[1.02]',
        overdue && 'border-rose-500/30 shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]'
      )}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-white/90 leading-tight">{item.title}</p>
          {overdue && <AlertTriangle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />}
        </div>

        {item.concept && (
          <p className="text-xs text-white/40 line-clamp-2">{item.concept}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="bg-white/[0.06] text-white/40 rounded-full text-xs px-2.5 py-0.5">
              {item.format}
            </span>
            <span className={cn('rounded-full text-xs px-2.5 py-0.5 font-medium', effortColors[item.effort])}>
              E{item.effort}
            </span>
          </div>
          <span className="text-[11px] text-white/25">{formatDateShort(item.scheduled_date)}</span>
        </div>
      </div>
    </div>
  )
}
