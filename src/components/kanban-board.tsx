'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { KanbanCard } from '@/components/kanban-card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ContentItem, KanbanStatus } from '@/types'
import { KANBAN_COLUMNS } from '@/types'
import { cn } from '@/lib/utils'

interface KanbanBoardProps {
  initialItems: ContentItem[]
  clientFilter?: string
}

function DroppableColumn({
  id,
  label,
  items,
  children,
}: {
  id: string
  label: string
  items: ContentItem[]
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[280px] w-[280px] flex-shrink-0 bg-white/[0.02] rounded-2xl transition-all duration-200',
        isOver && 'bg-violet-500/[0.04] ring-1 ring-violet-500/20'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30">{label}</h3>
        <span className="bg-white/[0.06] rounded-full px-2.5 py-0.5 text-[11px] text-white/40">
          {items.length}
        </span>
      </div>
      <div className="flex-1 px-2 pb-3 space-y-2.5 overflow-y-auto min-h-[200px]">
        {children}
      </div>
    </div>
  )
}

export function KanbanBoard({ initialItems, clientFilter }: KanbanBoardProps) {
  const [items, setItems] = useState(initialItems)
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting'>('connected')
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  useEffect(() => {
    let pollingInterval: ReturnType<typeof setInterval> | null = null

    const channel = supabase
      .channel('kanban-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_items',
        },
        (payload) => {
          const updated = payload.new as ContentItem
          setItems((prev) =>
            prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
          )
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
          if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('reconnecting')
          if (!pollingInterval) {
            pollingInterval = setInterval(async () => {
              const { data } = await supabase.from('content_items').select('*').order('kanban_order')
              if (data) setItems(data as ContentItem[])
            }, 30000)
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [supabase])

  const getColumnItems = useCallback(
    (status: KanbanStatus) =>
      items
        .filter((i) => i.kanban_status === status)
        .filter((i) => !clientFilter || i.client_id === clientFilter)
        .sort((a, b) => a.kanban_order - b.kanban_order),
    [items, clientFilter]
  )

  function handleDragStart(event: DragStartEvent) {
    const item = items.find((i) => i.id === event.active.id)
    setActiveItem(item ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    let newStatus: KanbanStatus
    const overColumn = KANBAN_COLUMNS.find((c) => c.key === overId)
    if (overColumn) {
      newStatus = overColumn.key
    } else {
      const overItem = items.find((i) => i.id === overId)
      newStatus = overItem?.kanban_status ?? 'to_record'
    }

    const newOrder = getColumnItems(newStatus).length

    setItems((prev) =>
      prev.map((item) =>
        item.id === activeId
          ? { ...item, kanban_status: newStatus, kanban_order: newOrder }
          : item
      )
    )

    try {
      const res = await fetch('/api/kanban/move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: activeId, newStatus, newOrder }),
      })
      const { error } = await res.json()
      if (error) toast.error('Erro ao mover card')
    } catch {
      toast.error('Erro ao mover card')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {connectionStatus === 'reconnecting' && (
        <div className="mb-4 bg-amber-500/[0.08] border border-amber-500/20 rounded-2xl px-4 py-3 text-amber-300 text-sm flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Reconectando... Atualizando a cada 30s
        </div>
      )}
      <div className="flex gap-5 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colItems = getColumnItems(col.key)
          return (
            <DroppableColumn
              key={col.key}
              id={col.key}
              label={col.label}
              items={colItems}
            >
              <SortableContext
                items={colItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {colItems.map((item) => (
                  <KanbanCard key={item.id} item={item} />
                ))}
              </SortableContext>
            </DroppableColumn>
          )
        })}
      </div>

      <DragOverlay>
        {activeItem ? <KanbanCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
