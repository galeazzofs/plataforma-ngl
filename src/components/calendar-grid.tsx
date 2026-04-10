'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Check, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { commitCalendar } from '@/lib/actions/calendar'
import { updateContentItem, deleteContentItem } from '@/lib/actions/content-items'
import type { ContentItem } from '@/types'
import { formatDateShort, cn } from '@/lib/utils'

interface CalendarGridProps {
  clientId: string
  calendarId: string | null
  initialItems: ContentItem[]
  status: 'draft' | 'committed' | null
}

const effortLabels: Record<number, string> = { 1: 'Simples', 2: 'Medio', 3: 'Complexo' }
const effortColors: Record<number, string> = {
  1: 'bg-emerald-500/10 text-emerald-400',
  2: 'bg-amber-500/10 text-amber-400',
  3: 'bg-red-500/10 text-red-400',
}

export function CalendarGrid({ clientId, calendarId, initialItems, status }: CalendarGridProps) {
  const [items, setItems] = useState(initialItems)
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentCalendarId, setCurrentCalendarId] = useState(calendarId)
  const [currentStatus, setCurrentStatus] = useState(status)

  async function generateCalendar() {
    setGenerating(true)
    try {
      const res = await fetch('/api/calendar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const { data, error } = await res.json()

      if (error) {
        toast.error('Erro ao gerar calendario', { description: error })
        return
      }

      setItems(data.items)
      setCurrentCalendarId(data.calendarId)
      setCurrentStatus('draft')
      toast.success('Calendario gerado com sucesso!')
    } catch {
      toast.error('Erro ao gerar calendario')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCommit() {
    if (!currentCalendarId) return
    try {
      await commitCalendar(currentCalendarId)
      setCurrentStatus('committed')
      toast.success('Calendario enviado para o Kanban!')
    } catch {
      toast.error('Erro ao enviar para Kanban')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteContentItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Video removido')
    } catch {
      toast.error('Erro ao remover video')
    }
  }

  async function handleSaveEdit(id: string, updates: Partial<ContentItem>) {
    try {
      await updateContentItem(id, updates)
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
      setEditingId(null)
      toast.success('Video atualizado')
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  const dayGroups = items.reduce<Record<number, ContentItem[]>>((acc, item) => {
    if (!acc[item.day_number]) acc[item.day_number] = []
    acc[item.day_number].push(item)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button
          onClick={generateCalendar}
          disabled={generating}
          className="bg-indigo-600 hover:bg-indigo-500 text-white transition-colors duration-150"
        >
          <Sparkles className={`h-4 w-4 mr-2 ${generating ? 'animate-pulse' : ''}`} />
          {generating ? 'Gerando...' : items.length ? 'Regenerar Calendario' : 'Gerar Calendario'}
        </Button>

        {currentStatus === 'draft' && items.length > 0 && (
          <Button
            variant="outline"
            onClick={handleCommit}
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors duration-150"
          >
            <Check className="h-4 w-4 mr-2" />
            Enviar para Kanban
          </Button>
        )}

        {currentStatus === 'committed' && (
          <span className="bg-emerald-500/10 text-emerald-400 rounded-full text-sm px-3 py-1 font-medium">
            Enviado ao Kanban
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-xl flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-2">Nenhum calendario gerado ainda</p>
          <p className="text-sm text-muted-foreground/60">Clique em &quot;Gerar Calendario&quot; para comecar</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 14 }, (_, i) => i + 1).map((dayNum) => {
            const dayItems = dayGroups[dayNum] ?? []
            const firstItem = dayItems[0]
            return (
              <div key={dayNum} className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="bg-secondary/50 px-4 py-2.5">
                  <p className="text-sm font-medium text-muted-foreground">
                    Dia {dayNum} — {firstItem ? formatDateShort(firstItem.scheduled_date) : ''}
                  </p>
                </div>
                <div className="p-3 space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 py-2">Sem videos</p>
                  ) : (
                    dayItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-secondary/30 rounded-lg p-3 space-y-2 border border-border/30"
                      >
                        {editingId === item.id ? (
                          <EditForm
                            item={item}
                            onSave={(updates) => handleSaveEdit(item.id, updates)}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <p className="font-medium text-sm text-foreground">{item.title}</p>
                              {currentStatus === 'draft' && (
                                <div className="flex gap-1">
                                  <button
                                    className="p-1 rounded text-muted-foreground/50 hover:text-foreground transition-colors duration-150"
                                    onClick={() => setEditingId(item.id)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    className="p-1 rounded text-muted-foreground/50 hover:text-red-400 transition-colors duration-150"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{item.concept}</p>
                            <div className="flex gap-1.5">
                              <span className="bg-secondary text-muted-foreground rounded-full text-xs px-2 py-0.5">
                                {item.format}
                              </span>
                              <span className={cn('rounded-full text-xs px-2 py-0.5 font-medium', effortColors[item.effort])}>
                                {effortLabels[item.effort]}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EditForm({
  item,
  onSave,
  onCancel,
}: {
  item: ContentItem
  onSave: (updates: Partial<ContentItem>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(item.title)
  const [concept, setConcept] = useState(item.concept)
  const [hook, setHook] = useState(item.hook)

  return (
    <div className="space-y-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-sm bg-secondary/50 border-border/50 rounded-lg"
      />
      <Textarea
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
        rows={2}
        className="text-sm bg-secondary/50 border-border/50 rounded-lg"
      />
      <Input
        value={hook}
        onChange={(e) => setHook(e.target.value)}
        placeholder="Hook"
        className="text-sm bg-secondary/50 border-border/50 rounded-lg"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave({ title, concept, hook })}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
        >
          Salvar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="text-muted-foreground text-xs"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
