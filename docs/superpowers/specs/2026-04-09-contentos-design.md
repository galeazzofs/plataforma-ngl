# ContentOS — Design Specification

## Overview

ContentOS is an internal creative management platform for a video marketing agency (~10 clients, ~15 team members). It automates trend research, generates AI-powered content calendars, and tracks video production through a Kanban board.

**Core value:** Reduce the time from "what should we post?" to "here's the plan" from hours to minutes per client.

## Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Visual tone | Clean/Professional + Modern SaaS accents | Daily-use tool, reduce fatigue |
| Users | Agency team only | Simplicity, no multi-tenant complexity |
| Trend collection | Hybrid: Google Trends via external free cron (cron-job.org), YouTube on-demand | $0 infra, no Playwright needed |
| Kanban realtime | Supabase Realtime (websockets) | Free tier, better UX than polling |
| AI calendar flow | Generate → edit draft → commit to Kanban | Control without over-engineering |
| Architecture | Single Next.js 14 monolith on Vercel | One deploy, $0/month |
| Scraping | cheerio (HTML parsing) instead of Playwright | Works on Vercel serverless |

## Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui + Lucide icons
- **Auth & DB:** Supabase (Auth + Postgres + Realtime)
- **AI:** Claude API (claude-sonnet-4-5)
- **Trends:** google-trends-api (npm) + cheerio
- **Deploy:** Vercel (free tier)

## Architecture

```
┌─────────────────────────────────────┐
│           Vercel (Next.js 14)       │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ App Router│  │ API Routes       │ │
│  │ (UI/SSR) │  │ /api/trends      │ │
│  │          │  │ /api/calendar    │ │
│  │          │  │ /api/kanban      │ │
│  └──────────┘  └──────────────────┘ │
└──────────┬──────────────┬───────────┘
           │              │
     ┌─────▼─────┐  ┌────▼─────┐
     │ Supabase  │  │ Claude   │
     │ Auth + DB │  │ API      │
     │ + Realtime│  │ (sonnet) │
     └───────────┘  └──────────┘
```

## Database Schema

### profiles
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK, FK → auth.users | |
| full_name | text | |
| role | text | 'admin' \| 'editor' \| 'producer' \| 'manager' |
| avatar_url | text, nullable | |
| created_at | timestamptz | |

### clients
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| niche | text | e.g. "moda feminina", "pet shop" |
| target_audience | text | |
| tone_of_voice | text | |
| main_products | text | |
| social_networks | jsonb | e.g. {"instagram": true, "tiktok": true} |
| content_examples | text | Free text, what worked before |
| created_by | uuid, FK → profiles | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### trends
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| niche | text | Denormalized for easy querying |
| source | text | 'google_trends' \| 'youtube' (TikTok deferred to post-MVP) |
| title | text | |
| description | text, nullable | |
| url | text, nullable | |
| relevance_score | int, nullable | From Google Trends |
| collected_at | timestamptz | |

### content_calendars
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| client_id | uuid, FK → clients | |
| generated_by | uuid, FK → profiles | |
| status | text | 'draft' \| 'committed' |
| period_start | date | |
| period_end | date | |
| raw_ai_response | jsonb | Full Claude output for audit |
| created_at | timestamptz | |

### content_items
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| calendar_id | uuid, FK → content_calendars | |
| client_id | uuid, FK → clients | Denormalized for Kanban queries |
| day_number | int | 1-14 |
| scheduled_date | date | |
| title | text | |
| concept | text | |
| hook | text | First 3 seconds |
| script_outline | text | Bullet points |
| suggested_audio | text | |
| cta | text | |
| format | text | 'reels' \| 'shorts' \| 'tiktok' |
| effort | int | 1-3 |
| kanban_status | text | 'to_record' \| 'editing' \| 'review' \| 'approval' \| 'published' |
| kanban_order | int | For drag-and-drop ordering within column |
| assigned_to | uuid, FK → profiles, nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Key schema decisions:**
- No separate kanban_columns table — 5 columns are hardcoded in UI, `kanban_status` is source of truth.
- Trends linked by `niche` (not FK to clients) — multiple clients in same niche share trends.
- `content_calendars.raw_ai_response` stores full AI output for auditability.
- `social_networks` is jsonb to stay flexible.

### Row Level Security (RLS)

All tables have RLS enabled. Since this is an internal-only tool, all policies use a simple "authenticated users can do everything" pattern:

```sql
-- Applied to every table:
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access" ON <table>
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

This keeps it simple for MVP. Role-based restrictions (e.g., only admins can delete clients) can be added later by refining policies.

## Pages & Navigation

Sidebar layout — persistent left sidebar, content area right.

| Route | Purpose |
|---|---|
| `/login` | Auth page (no sidebar) |
| `/dashboard` | Overview: clients, video counts per stage, delay alerts |
| `/clients` | Client list (table view) |
| `/clients/new` | Create client form |
| `/clients/[id]` | Client detail with tabs for calendar & trends |
| `/clients/[id]/calendar` | AI calendar generation → draft editor → commit |
| `/clients/[id]/trends` | Trends for client's niche + "Collect Now" button |
| `/kanban` | Global Kanban, filterable by client |
| `/kanban/[clientId]` | Kanban filtered to one client |
| `/settings` | Team management (invite users, roles) |

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| Background | slate-50 (#f8fafc) | Page background |
| Sidebar bg | white | Sidebar background |
| Sidebar border | slate-200 | Right border |
| Primary | indigo-600 (#4f46e5) | Buttons, active nav, links |
| Secondary | violet-500 (#8b5cf6) | Badges, highlights |
| Card bg | white | Card backgrounds |
| Card border | slate-200 | Card borders |
| Card shadow | shadow-sm | Subtle elevation |
| Text heading | slate-900 | Headings |
| Text body | slate-600 | Body text |
| Text muted | slate-400 | Secondary text |
| Destructive | red-500 | Delete, errors |
| Success | emerald-500 | Published, confirmed |
| Font | Inter | System default in shadcn/ui |

**Responsive:** Desktop-first. Sidebar collapses to bottom nav on mobile (< 768px), but mobile is secondary.

## Key Flows

### Flow 1: Trend Collection (Hybrid)

```
User clicks "Collect Trends" on /clients/[id]/trends
  → POST /api/trends/collect { clientId }
    → Reads client's niche
    → Parallel:
       ├─ google-trends-api: related queries for niche keywords
       └─ cheerio: fetch YouTube trending page, parse by category
    → Upsert into trends table (deduplicate by title+source+date)
    → Return results to UI
```

Google Trends also runs weekly via an external free cron service (cron-job.org) that hits `/api/trends/collect-all` with a secret header for auth. This endpoint loops all distinct niches. Vercel Hobby tier does not support cron jobs, so we use an external trigger instead.

### Flow 2: AI Calendar Generation

```
User opens /clients/[id]/calendar, clicks "Generate Calendar"
  → POST /api/calendar/generate { clientId }
    → Fetches: client profile + trends (last 7 days, same niche)
    → Builds prompt with structured output instructions
    → Calls Claude API (claude-sonnet-4-5)
    → Parses JSON response
    → Saves to content_calendars (status: 'draft') + content_items
    → Returns draft to UI

User sees 14-day grid:
  - Edit any field inline
  - Delete individual videos
  - Re-order within a day
  - "Commit to Kanban" → status = 'committed', items get kanban_status = 'to_record'
```

### Flow 3: Kanban Board

```
/kanban renders 5 columns:
  A gravar → Editando → Revisão → Aprovação → Publicado

  → Groups content_items by kanban_status, ordered by kanban_order
  → Drag card between columns:
    → Optimistic UI update
    → PATCH /api/kanban/move
    → Supabase Realtime broadcasts to all connected users
```

### Flow 4: Dashboard

```
/dashboard loads:
  → All clients with aggregated content_items counts per kanban_status
  → Overdue query: scheduled_date < today AND kanban_status != 'published'
  → Summary cards + alert list
```

## AI Prompt Structure

System prompt instructs Claude to act as a video content strategist. User prompt includes:
1. Full client profile (name, niche, audience, tone, products, networks, examples)
2. Recent trends for the niche (last 7 days)
3. Task: generate 14-day calendar, 1-2 videos/day
4. Output schema: JSON with days[].videos[] containing title, concept, hook, script_outline, suggested_audio, cta, format, effort

**parse-calendar.ts responsibilities:**
- Validate JSON structure from Claude response
- Map `day_number` (1-14) to `scheduled_date` using `period_start + day_number - 1`
- Set default `kanban_status = 'to_record'` and `kanban_order` (sequential per column)
- Generate UUIDs for each content_item
- Assign `client_id` from the request context

**Cost estimate:** ~$0.07 per calendar generation. 10 clients x 2/month = ~$1.40/month.

All responses in Brazilian Portuguese.

## Error Handling

| Scenario | Handling |
|---|---|
| Auth expired | Redirect to /login |
| Claude API timeout (60s) | Error toast, retry button |
| Malformed AI JSON | Retry once with stricter prompt, then error |
| Google Trends API fails | Partial results + toast |
| YouTube scraping blocked | Graceful degradation, log error. YouTube scraper uses YouTube RSS feeds (`https://www.youtube.com/feeds/videos.xml?chart=trending&gl=BR`) as primary source (server-rendered XML, cheerio-compatible). Falls back to trending page HTML parsing if RSS unavailable. |
| No trends found | Empty state with suggestion to adjust niche |
| Realtime connection drops | Fall back to 30s polling, "reconnecting..." indicator |
| Concurrent Kanban moves | Last write wins, Realtime syncs final state |
| Draft already exists | Warn user, option to replace |

**API response shape:** All routes return `{ data, error }`.
**Notifications:** shadcn/ui sonner for toast feedback.
**No silent failures** — every error surfaces to the user.

## Data Access Pattern

**Server Actions (Next.js) for CRUD operations:** Client create/update/delete, content_item edits, user assignments, and calendar commits use Next.js Server Actions (in `src/lib/actions/`). These run server-side with Supabase service client, avoiding the need for separate API routes for every CRUD operation.

**Dedicated API routes for complex operations:** Trend collection (`/api/trends/*`), AI calendar generation (`/api/calendar/generate`), and Kanban moves (`/api/kanban/move`) use API routes because they involve external services, long-running processes, or need to be called by external cron triggers.

**Direct Supabase client for reads:** List queries (clients list, kanban board, dashboard stats) use the Supabase browser client directly in Server Components for simplicity.

## Authentication Flow

- **Provider:** Email/password (Supabase Auth). Simple for an internal team.
- **Signup:** Admin invites users via `/settings` — sends a Supabase invite email. New user sets password on first login.
- **Profile creation:** A Supabase database trigger (`on_auth_user_created`) auto-creates a row in `profiles` with the user's ID and email-derived name. User can edit their profile later.
- **Middleware:** `middleware.ts` at the project root uses `@supabase/ssr` to check session on every request to `/(dashboard)/*` routes. Expired/missing session → redirect to `/login`.
- **No OAuth** for MVP — email/password only.

## File Structure (Planned)

```
contentos/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          — sidebar layout
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx        — client list
│   │   │   │   ├── new/page.tsx    — create client
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx    — client detail
│   │   │   │       ├── calendar/page.tsx
│   │   │   │       └── trends/page.tsx
│   │   │   ├── kanban/
│   │   │   │   ├── page.tsx        — global kanban
│   │   │   │   └── [clientId]/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── trends/
│   │   │   │   ├── collect/route.ts
│   │   │   │   └── collect-all/route.ts
│   │   │   ├── calendar/
│   │   │   │   └── generate/route.ts
│   │   │   └── kanban/
│   │   │       └── move/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     — shadcn/ui components
│   │   ├── sidebar.tsx
│   │   ├── client-form.tsx
│   │   ├── calendar-grid.tsx
│   │   ├── kanban-board.tsx
│   │   ├── kanban-card.tsx
│   │   ├── trend-list.tsx
│   │   └── dashboard-stats.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           — browser client
│   │   │   ├── server.ts           — server client
│   │   │   └── middleware.ts       — auth middleware
│   │   ├── actions/
│   │   │   ├── clients.ts          — client CRUD server actions
│   │   │   ├── content-items.ts    — content item edits, assignments
│   │   │   └── calendar.ts         — commit calendar to kanban
│   │   ├── ai/
│   │   │   ├── prompt.ts           — prompt builder
│   │   │   └── parse-calendar.ts   — response parser + field mapping
│   │   ├── trends/
│   │   │   ├── google-trends.ts
│   │   │   └── youtube-scraper.ts  — cheerio-based, fetches RSS/HTML
│   │   └── utils.ts
│   └── types/
│       └── index.ts                — shared TypeScript types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── public/
├── middleware.ts                    — Supabase auth middleware (project root)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local.example
```

## Cost Summary

| Service | Tier | Cost |
|---|---|---|
| Vercel | Hobby | $0/month |
| Supabase | Free | $0/month (500MB DB, 50k auth users, Realtime included) |
| Claude API | Pay-as-you-go | ~$1.40/month |
| **Total** | | **~$1.40/month** |

## Out of Scope (MVP)

- Client-facing portal / login
- Video file upload or editing
- Direct social media publishing (API integrations)
- Analytics / performance tracking of published content
- Multi-language support (PT-BR only)
- Mobile-optimized experience (desktop-first)
- TikTok Creative Center scraping (can add later)
