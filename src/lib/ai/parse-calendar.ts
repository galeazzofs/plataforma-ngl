import { randomUUID } from 'crypto'
import type { AICalendarOutput, ContentItem, VideoFormat, EffortLevel } from '@/types'

const VALID_FORMATS: VideoFormat[] = ['reels', 'shorts', 'tiktok']
const VALID_EFFORTS: EffortLevel[] = [1, 2, 3]

export function parseCalendarResponse(
  raw: string,
  calendarId: string,
  clientId: string,
  periodStart: string
): { items: Omit<ContentItem, 'created_at' | 'updated_at'>[]; parsed: AICalendarOutput } {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed: AICalendarOutput = JSON.parse(cleaned)

  if (!parsed.days || !Array.isArray(parsed.days)) {
    throw new Error('Invalid calendar response: missing days array')
  }

  const items: Omit<ContentItem, 'created_at' | 'updated_at'>[] = []
  let orderCounter = 0

  for (const day of parsed.days) {
    const dayNumber = day.day_number
    if (dayNumber < 1 || dayNumber > 14) continue

    const scheduledDate = new Date(periodStart)
    scheduledDate.setDate(scheduledDate.getDate() + dayNumber - 1)
    const dateStr = scheduledDate.toISOString().split('T')[0]

    for (const video of day.videos ?? []) {
      items.push({
        id: randomUUID(),
        calendar_id: calendarId,
        client_id: clientId,
        day_number: dayNumber,
        scheduled_date: dateStr,
        title: video.title || 'Sem titulo',
        concept: video.concept || '',
        hook: video.hook || '',
        script_outline: video.script_outline || '',
        suggested_audio: video.suggested_audio || '',
        cta: video.cta || '',
        format: VALID_FORMATS.includes(video.format as VideoFormat)
          ? (video.format as VideoFormat)
          : 'reels',
        effort: VALID_EFFORTS.includes(video.effort as EffortLevel)
          ? (video.effort as EffortLevel)
          : 1,
        kanban_status: 'to_record',
        kanban_order: orderCounter++,
        assigned_to: null,
      })
    }
  }

  return { items, parsed }
}
