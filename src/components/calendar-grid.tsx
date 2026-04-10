'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Check, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { commitCalendar } from '@/lib/actions/calendar'
import { updateContentItem, deleteContentItem } from '@/lib/actions/content-items'
import type { ContentItem } from '@/types'
import { formatDateShort } from '@/lib/utils'

interface CalendarGridProps {
  clientId: string
  calendarId: string | null
  initialItems: ContentItem[]
  status: 'draft' | 'committed' | null
}

const effortLabels: Record<number, string> = { 1: 'Simples', 2: 'Medio', 3: 'Complexo' }
const effortColors: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-red-100 text-red-700',
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
        <Button onClick={generateCalendar} disabled={generating}>
          <Sparkles className={`h-4 w-4 mr-2 ${generating ? 'animate-pulse' : ''}`} />
          {generating ? 'Gerando...' : items.length ? 'Regenerar Calendario' : 'Gerar Calendario'}
        </Button>

        {currentStatus === 'draft' && items.length > 0 && (
          <Button variant="outline" onClick={handleCommit}>
            <Check className="h-4 w-4 mr-2" />
            Enviar para Kanban
          </Button>
        )}

        {currentStatus === 'committed' && (
          <Badge className="bg-emerald-100 text-emerald-700">Enviado ao Kanban</Badge>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-500 mb-4">Nenhum calendario gerado ainda</p>
            <p className="text-sm text-slate-400">Clique em &quot;Gerar Calendario&quot; para comecar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 14 }, (_, i) => i + 1).map((dayNum) => {
            const dayItems = dayGroups[dayNum] ?? []
            const firstItem = dayItems[0]
            return (
              <Card key={dayNum} className="overflow-hidden">
                <CardHeader className="py-3 px-4 bg-slate-50">
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Dia {dayNum} — {firstItem ? formatDateShort(firstItem.scheduled_date) : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">Sem videos</p>
                  ) : (
                    dayItems.map((item) => (
                      <div
                        key={item.id}
                        className="border border-slate-200 rounded-lg p-3 space-y-2"
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
                              <p className="font-medium text-sm text-slate-900">{item.title}</p>
                              {currentStatus === 'draft' && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setEditingId(item.id)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{item.concept}</p>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">{item.format}</Badge>
                              <Badge className={`text-xs ${effortColors[item.effort]}`}>
                                {effortLabels[item.effort]}
                              </Badge>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
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
      <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm" />
      <Textarea value={concept} onChange={(e) => setConcept(e.target.value)} rows={2} className="text-sm" />
      <Input value={hook} onChange={(e) => setHook(e.target.value)} placeholder="Hook" className="text-sm" />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ title, concept, hook })}>Salvar</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  )
}
