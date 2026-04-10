export type UserRole = 'admin' | 'editor' | 'producer' | 'manager'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Client {
  id: string
  name: string
  niche: string
  target_audience: string
  tone_of_voice: string
  main_products: string
  social_networks: Record<string, boolean>
  content_examples: string
  created_by: string
  created_at: string
  updated_at: string
}

export type TrendSource = 'google_trends' | 'youtube'

export interface Trend {
  id: string
  niche: string
  source: TrendSource
  title: string
  description: string | null
  url: string | null
  relevance_score: number | null
  collected_at: string
}

export type CalendarStatus = 'draft' | 'committed'

export interface ContentCalendar {
  id: string
  client_id: string
  generated_by: string
  status: CalendarStatus
  period_start: string
  period_end: string
  raw_ai_response: unknown
  created_at: string
}

export type VideoFormat = 'reels' | 'shorts' | 'tiktok'
export type KanbanStatus = 'to_record' | 'editing' | 'review' | 'approval' | 'published'
export type EffortLevel = 1 | 2 | 3

export interface ContentItem {
  id: string
  calendar_id: string
  client_id: string
  day_number: number
  scheduled_date: string
  title: string
  concept: string
  hook: string
  script_outline: string
  suggested_audio: string
  cta: string
  format: VideoFormat
  effort: EffortLevel
  kanban_status: KanbanStatus
  kanban_order: number
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export const KANBAN_COLUMNS: { key: KanbanStatus; label: string }[] = [
  { key: 'to_record', label: 'A Gravar' },
  { key: 'editing', label: 'Editando' },
  { key: 'review', label: 'Revisão' },
  { key: 'approval', label: 'Aprovação' },
  { key: 'published', label: 'Publicado' },
]

export interface AIVideoOutput {
  title: string
  concept: string
  hook: string
  script_outline: string
  suggested_audio: string
  cta: string
  format: VideoFormat
  effort: EffortLevel
}

export interface AIDayOutput {
  day_number: number
  date: string
  videos: AIVideoOutput[]
}

export interface AICalendarOutput {
  days: AIDayOutput[]
}
