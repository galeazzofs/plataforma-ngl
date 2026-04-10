# ContentOS Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ContentOS — an internal video marketing agency platform with client management, AI-powered content calendars, trend collection, Kanban production board, and dashboard.

**Architecture:** Single Next.js 14 (App Router) monolith on Vercel. Supabase for auth, Postgres DB, and Realtime. Claude API for AI calendar generation. shadcn/ui + Tailwind for UI.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Supabase (@supabase/supabase-js, @supabase/ssr), Anthropic SDK, google-trends-api, cheerio, dnd-kit (drag-and-drop), sonner (toasts), Lucide icons.

**Spec:** `docs/superpowers/specs/2026-04-09-contentos-design.md`

---

## File Structure

All paths relative to project root.

| File | Responsibility |
|---|---|
| `src/types/index.ts` | Shared TypeScript types for all entities |
| `src/lib/supabase/client.ts` | Browser Supabase client (createBrowserClient) |
| `src/lib/supabase/server.ts` | Server Supabase client (createServerClient with cookies) |
| `src/lib/supabase/admin.ts` | Admin Supabase client (service_role key, for cron/triggers) |
| `middleware.ts` | Root Next.js middleware — auth guard for dashboard routes |
| `supabase/migrations/001_initial_schema.sql` | Full DB schema + RLS + trigger |
| `src/app/layout.tsx` | Root layout (fonts, globals) |
| `src/app/globals.css` | Tailwind directives + custom tokens |
| `src/app/(auth)/login/page.tsx` | Login page |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell — sidebar + content area |
| `src/components/sidebar.tsx` | Sidebar navigation component |
| `src/app/(dashboard)/clients/page.tsx` | Client list page |
| `src/app/(dashboard)/clients/new/page.tsx` | Create client page |
| `src/app/(dashboard)/clients/[id]/page.tsx` | Client detail page |
| `src/components/client-form.tsx` | Reusable client form (create + edit) |
| `src/lib/actions/clients.ts` | Server actions: createClient, updateClient, deleteClient |
| `src/app/(dashboard)/clients/[id]/trends/page.tsx` | Trends page per client |
| `src/components/trend-list.tsx` | Trend list + collect button component |
| `src/lib/trends/google-trends.ts` | Google Trends API wrapper |
| `src/lib/trends/youtube-scraper.ts` | YouTube RSS/HTML cheerio scraper |
| `src/app/api/trends/collect/route.ts` | POST: collect trends for one client's niche |
| `src/app/api/trends/collect-all/route.ts` | POST: collect trends for all niches (cron endpoint) |
| `src/app/(dashboard)/clients/[id]/calendar/page.tsx` | Calendar generation + draft editor |
| `src/components/calendar-grid.tsx` | 14-day calendar grid with editable cards |
| `src/lib/ai/prompt.ts` | Claude prompt builder |
| `src/lib/ai/parse-calendar.ts` | AI response parser + field mapping |
| `src/app/api/calendar/generate/route.ts` | POST: generate calendar via Claude API |
| `src/lib/actions/calendar.ts` | Server action: commitCalendar |
| `src/lib/actions/content-items.ts` | Server actions: updateContentItem, deleteContentItem, assignContentItem |
| `src/app/(dashboard)/kanban/page.tsx` | Global Kanban board |
| `src/app/(dashboard)/kanban/[clientId]/page.tsx` | Client-filtered Kanban |
| `src/components/kanban-board.tsx` | Kanban board with drag-and-drop + realtime |
| `src/components/kanban-card.tsx` | Individual Kanban card |
| `src/app/api/kanban/move/route.ts` | PATCH: move card between columns |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard overview |
| `src/components/dashboard-stats.tsx` | Stats cards + overdue alerts |
| `src/app/(dashboard)/settings/page.tsx` | Team settings page |
| `src/lib/utils.ts` | Shared utilities (cn, formatDate, etc.) |
| `.env.local.example` | Environment variable template |

---

## Chunk 1: Project Scaffolding + Supabase + Auth

### Task 1: Initialize Next.js project and install dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.env.local.example`

- [ ] **Step 1: Create Next.js project**

```bash
cd "C:/Users/ferna/OneDrive/Área de Trabalho/plataforma-ngl"
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Expected: Project scaffolded with `src/app/` structure.

- [ ] **Step 2: Install all dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk google-trends-api cheerio @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities sonner
npm install -D @types/google-trends-api
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

Select: New York style, Slate base color, CSS variables: yes.

- [ ] **Step 4: Add required shadcn/ui components**

```bash
npx shadcn@latest add button input label textarea card table badge dialog dropdown-menu select separator sheet tabs toast avatar alert
```

- [ ] **Step 5: Create .env.local.example**

Create: `.env.local.example`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
CRON_SECRET=your_cron_secret
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000 without errors.

- [ ] **Step 7: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Next.js 14 project with dependencies and shadcn/ui"
```

---

### Task 2: TypeScript types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write all shared types**

```typescript
// src/types/index.ts

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

// AI calendar generation types
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts && git commit -m "feat: add shared TypeScript types for all entities"
```

---

### Task 3: Supabase client utilities

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`

- [ ] **Step 1: Create browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create admin client (service role)**

```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/ && git commit -m "feat: add Supabase client utilities (browser, server, admin)"
```

---

### Task 4: Auth middleware

**Files:**
- Create: `middleware.ts` (project root)

- [ ] **Step 1: Write middleware**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/trends/collect-all).*)',
  ],
}
```

Note: `/api/trends/collect-all` is excluded from middleware so the external cron can hit it with just the secret header.

- [ ] **Step 2: Commit**

```bash
git add middleware.ts && git commit -m "feat: add auth middleware with route protection"
```

---

### Task 5: Database migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Write the full SQL schema**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'producer', 'manager')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON profiles
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT '',
  tone_of_voice TEXT NOT NULL DEFAULT '',
  main_products TEXT NOT NULL DEFAULT '',
  social_networks JSONB NOT NULL DEFAULT '{}',
  content_examples TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON clients
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- TRENDS
-- ============================================
CREATE TABLE trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  niche TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('google_trends', 'youtube')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  relevance_score INT,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON trends
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Index for niche + date queries
CREATE INDEX idx_trends_niche_collected ON trends(niche, collected_at DESC);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX idx_trends_unique ON trends(niche, source, title, (collected_at::date));

-- ============================================
-- CONTENT CALENDARS
-- ============================================
CREATE TABLE content_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'committed')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  raw_ai_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE content_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON content_calendars
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- CONTENT ITEMS
-- ============================================
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id UUID NOT NULL REFERENCES content_calendars(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  day_number INT NOT NULL CHECK (day_number BETWEEN 1 AND 14),
  scheduled_date DATE NOT NULL,
  title TEXT NOT NULL,
  concept TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  script_outline TEXT NOT NULL DEFAULT '',
  suggested_audio TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT 'reels' CHECK (format IN ('reels', 'shorts', 'tiktok')),
  effort INT NOT NULL DEFAULT 1 CHECK (effort BETWEEN 1 AND 3),
  kanban_status TEXT NOT NULL DEFAULT 'to_record' CHECK (kanban_status IN ('to_record', 'editing', 'review', 'approval', 'published')),
  kanban_order INT NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON content_items
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Index for Kanban queries
CREATE INDEX idx_content_items_kanban ON content_items(client_id, kanban_status, kanban_order);

-- Index for overdue queries
CREATE INDEX idx_content_items_overdue ON content_items(scheduled_date, kanban_status);

-- Enable realtime for kanban
ALTER PUBLICATION supabase_realtime ADD TABLE content_items;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/ && git commit -m "feat: add initial database schema with RLS and triggers"
```

---

### Task 6: Utils and globals

**Files:**
- Create: `src/lib/utils.ts`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

- [ ] **Step 1: Write utils**

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

export function isOverdue(scheduledDate: string, status: string): boolean {
  return status !== 'published' && new Date(scheduledDate) < new Date()
}
```

Note: `cn` may already exist from shadcn init. If so, just add the date helpers to the existing file.

- [ ] **Step 2: Update globals.css with design tokens**

Ensure `src/app/globals.css` has the Tailwind directives and the shadcn CSS variables are using our slate/indigo/violet tokens. The shadcn init should have already created this — adjust the `:root` variables to match our design tokens:

```css
/* Add/adjust in :root section */
--background: 210 40% 98%;      /* slate-50 */
--foreground: 222.2 84% 4.9%;   /* slate-900 */
--primary: 238.7 83.5% 66.7%;   /* indigo-600 */
--primary-foreground: 0 0% 100%;
```

- [ ] **Step 3: Update root layout with Sonner**

Modify `src/app/layout.tsx` to add the Toaster:

```typescript
// Add to imports:
import { Toaster } from 'sonner'

// Add inside <body> after {children}:
<Toaster richColors position="top-right" />
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts src/app/globals.css src/app/layout.tsx && git commit -m "feat: add utils, design tokens, and toast provider"
```

---

### Task 7: Login page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Write login page**

```tsx
// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Erro ao fazer login', { description: error.message })
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">ContentOS</CardTitle>
          <CardDescription className="text-slate-500">
            Gestão criativa para sua agência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/ && git commit -m "feat: add login page with Supabase auth"
```

---

### Task 8: Dashboard layout with sidebar

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`, `src/components/sidebar.tsx`

- [ ] **Step 1: Write sidebar component**

```tsx
// src/components/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Kanban,
  Settings,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Erro ao sair')
      return
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <Link href="/dashboard" className="text-xl font-bold text-slate-900">
          ContentOS
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-600 hover:text-slate-900"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Write dashboard layout**

```tsx
// src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Create placeholder dashboard page**

```tsx
// src/app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500 mt-1">Visão geral da produção</p>
    </div>
  )
}
```

- [ ] **Step 4: Add root redirect to dashboard**

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar.tsx src/app/(dashboard)/ src/app/page.tsx && git commit -m "feat: add dashboard layout with sidebar navigation"
```

---

## Chunk 2: Client CRUD

### Task 9: Client server actions

**Files:**
- Create: `src/lib/actions/clients.ts`

- [ ] **Step 1: Write client server actions**

```typescript
// src/lib/actions/clients.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createClient(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const socialNetworks: Record<string, boolean> = {}
  const networks = ['instagram', 'tiktok', 'youtube', 'facebook']
  networks.forEach((net) => {
    if (formData.get(net) === 'on') socialNetworks[net] = true
  })

  const { error } = await supabase.from('clients').insert({
    name: formData.get('name') as string,
    niche: formData.get('niche') as string,
    target_audience: formData.get('target_audience') as string,
    tone_of_voice: formData.get('tone_of_voice') as string,
    main_products: formData.get('main_products') as string,
    social_networks: socialNetworks,
    content_examples: formData.get('content_examples') as string,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  redirect('/clients')
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const socialNetworks: Record<string, boolean> = {}
  const networks = ['instagram', 'tiktok', 'youtube', 'facebook']
  networks.forEach((net) => {
    if (formData.get(net) === 'on') socialNetworks[net] = true
  })

  const { error } = await supabase
    .from('clients')
    .update({
      name: formData.get('name') as string,
      niche: formData.get('niche') as string,
      target_audience: formData.get('target_audience') as string,
      tone_of_voice: formData.get('tone_of_voice') as string,
      main_products: formData.get('main_products') as string,
      social_networks: socialNetworks,
      content_examples: formData.get('content_examples') as string,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/clients/${id}`)
  revalidatePath('/clients')
  redirect(`/clients/${id}`)
}

export async function deleteClient(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  redirect('/clients')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/clients.ts && git commit -m "feat: add client CRUD server actions"
```

---

### Task 10: Client form component

**Files:**
- Create: `src/components/client-form.tsx`

- [ ] **Step 1: Write reusable client form**

```tsx
// src/components/client-form.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Client } from '@/types'

interface ClientFormProps {
  action: (formData: FormData) => Promise<void>
  client?: Client
}

const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'facebook', label: 'Facebook' },
]

export function ClientForm({ action, client }: ClientFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={client?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="niche">Nicho</Label>
              <Input
                id="niche"
                name="niche"
                placeholder="ex: moda feminina, pet shop"
                defaultValue={client?.niche}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Público-alvo</Label>
            <Textarea
              id="target_audience"
              name="target_audience"
              placeholder="Descreva o público-alvo do cliente"
              defaultValue={client?.target_audience}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone_of_voice">Tom de Voz</Label>
            <Input
              id="tone_of_voice"
              name="tone_of_voice"
              placeholder="ex: descontraído, profissional, jovem"
              defaultValue={client?.tone_of_voice}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="main_products">Produtos Principais</Label>
            <Textarea
              id="main_products"
              name="main_products"
              placeholder="Liste os produtos ou serviços principais"
              defaultValue={client?.main_products}
            />
          </div>

          <div className="space-y-2">
            <Label>Redes Sociais Ativas</Label>
            <div className="flex flex-wrap gap-4">
              {SOCIAL_NETWORKS.map((net) => (
                <label key={net.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={net.key}
                    defaultChecked={client?.social_networks?.[net.key]}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600">{net.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_examples">Exemplos de Conteúdo que Funcionou</Label>
            <Textarea
              id="content_examples"
              name="content_examples"
              placeholder="Descreva conteúdos anteriores que tiveram bom desempenho"
              rows={4}
              defaultValue={client?.content_examples}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit">
              {client ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/client-form.tsx && git commit -m "feat: add reusable client form component"
```

---

### Task 11: Client list page

**Files:**
- Create: `src/app/(dashboard)/clients/page.tsx`

- [ ] **Step 1: Write client list page**

```tsx
// src/app/(dashboard)/clients/page.tsx
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import type { Client } from '@/types'

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">{clients?.length ?? 0} clientes cadastrados</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {!clients?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-500 mb-4">Nenhum cliente cadastrado ainda</p>
            <Button asChild>
              <Link href="/clients/new">Adicionar primeiro cliente</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(clients as Client[]).map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-slate-900">{client.name}</h3>
                  <Badge variant="secondary" className="mt-2">
                    {client.niche}
                  </Badge>
                  <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                    {client.target_audience}
                  </p>
                  <div className="flex gap-1 mt-3">
                    {Object.entries(client.social_networks || {})
                      .filter(([, active]) => active)
                      .map(([network]) => (
                        <Badge key={network} variant="outline" className="text-xs">
                          {network}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/clients/page.tsx && git commit -m "feat: add client list page"
```

---

### Task 12: Create client page

**Files:**
- Create: `src/app/(dashboard)/clients/new/page.tsx`

- [ ] **Step 1: Write create client page**

```tsx
// src/app/(dashboard)/clients/new/page.tsx
import { ClientForm } from '@/components/client-form'
import { createClient } from '@/lib/actions/clients'

export default function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Novo Cliente</h1>
      <ClientForm action={createClient} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/clients/new/ && git commit -m "feat: add create client page"
```

---

### Task 13: Client detail page

**Files:**
- Create: `src/app/(dashboard)/clients/[id]/page.tsx`

- [ ] **Step 1: Write client detail page**

```tsx
// src/app/(dashboard)/clients/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClientForm } from '@/components/client-form'
import { updateClient, deleteClient } from '@/lib/actions/clients'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, TrendingUp, Trash2 } from 'lucide-react'
import type { Client } from '@/types'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const typedClient = client as Client
  const updateWithId = updateClient.bind(null, id)
  const deleteWithId = deleteClient.bind(null, id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{typedClient.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${id}/trends`}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Trends
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${id}/calendar`}>
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendário
            </Link>
          </Button>
          <form action={deleteWithId}>
            <Button variant="destructive" size="icon" type="submit">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-2xl">
        <ClientForm action={updateWithId} client={typedClient} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/clients/[id]/page.tsx && git commit -m "feat: add client detail page with edit and delete"
```

---

## Chunk 3: Trend Collection

### Task 14: Google Trends wrapper

**Files:**
- Create: `src/lib/trends/google-trends.ts`

- [ ] **Step 1: Write Google Trends wrapper**

```typescript
// src/lib/trends/google-trends.ts
import googleTrends from 'google-trends-api'
import type { Trend } from '@/types'
export async function fetchGoogleTrends(niche: string): Promise<Omit<Trend, 'id' | 'collected_at'>[]> {
  try {
    const results = await googleTrends.relatedQueries({
      keyword: niche,
      geo: 'BR',
      hl: 'pt-BR',
    })

    const parsed = JSON.parse(results)
    const queries = parsed?.default?.rankedList ?? []
    const trends: Omit<Trend, 'id' | 'collected_at'>[] = []

    for (const list of queries) {
      for (const item of list.rankedKeyword ?? []) {
        trends.push({
          niche,
          source: 'google_trends',
          title: item.query,
          description: null,
          url: null,
          relevance_score: item.value ?? null,
        })
      }
    }

    return trends.slice(0, 20) // Cap at 20 results per niche
  } catch (error) {
    console.error('Google Trends error:', error)
    return []
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/trends/google-trends.ts && git commit -m "feat: add Google Trends API wrapper"
```

---

### Task 15: YouTube scraper

**Files:**
- Create: `src/lib/trends/youtube-scraper.ts`

- [ ] **Step 1: Write YouTube RSS scraper**

```typescript
// src/lib/trends/youtube-scraper.ts
import * as cheerio from 'cheerio'
import type { Trend } from '@/types'

const YOUTUBE_RSS_URL = 'https://www.youtube.com/feeds/videos.xml?chart=most_popular&gl=BR'

export async function fetchYouTubeTrending(): Promise<Omit<Trend, 'id' | 'collected_at' | 'niche'>[]> {
  try {
    const response = await fetch(YOUTUBE_RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentOS/1.0)',
      },
    })

    if (!response.ok) {
      console.error('YouTube RSS fetch failed:', response.status)
      return []
    }

    const xml = await response.text()
    const $ = cheerio.load(xml, { xmlMode: true })
    const trends: Omit<Trend, 'id' | 'collected_at' | 'niche'>[] = []

    $('entry').each((i, el) => {
      if (i >= 25) return false // Cap at 25

      const title = $(el).find('title').text()
      const url = $(el).find('link').attr('href') ?? null
      const description = $(el).find('media\\:description, description').text().slice(0, 200) || null

      if (title) {
        trends.push({
          source: 'youtube',
          title,
          description,
          url,
          relevance_score: null,
        })
      }
    })

    return trends
  } catch (error) {
    console.error('YouTube scraper error:', error)
    return []
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/trends/youtube-scraper.ts && git commit -m "feat: add YouTube RSS trending scraper"
```

---

### Task 16: Trend collection API routes

**Files:**
- Create: `src/app/api/trends/collect/route.ts`, `src/app/api/trends/collect-all/route.ts`

- [ ] **Step 1: Write single-client trend collection endpoint**

```typescript
// src/app/api/trends/collect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchGoogleTrends } from '@/lib/trends/google-trends'
import { fetchYouTubeTrending } from '@/lib/trends/youtube-scraper'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await request.json()

    // Get client niche
    const { data: client } = await supabase
      .from('clients')
      .select('niche')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ data: null, error: 'Client not found' }, { status: 404 })
    }

    // Fetch trends in parallel
    const [googleTrends, youtubeTrends] = await Promise.all([
      fetchGoogleTrends(client.niche),
      fetchYouTubeTrending(),
    ])

    // Prepare rows — YouTube trends get the client's niche
    const rows = [
      ...googleTrends,
      ...youtubeTrends.map((t) => ({ ...t, niche: client.niche })),
    ]

    if (rows.length === 0) {
      return NextResponse.json({ data: [], error: null })
    }

    // Insert rows one by one, skipping duplicates (unique index handles dedup)
    const inserted: unknown[] = []
    for (const row of rows) {
      const { data, error } = await supabase
        .from('trends')
        .insert(row)
        .select()
        .single()

      if (data) inserted.push(data)
      // Duplicate key errors (23505) are expected — skip silently
      if (error && !error.code?.includes('23505')) {
        console.error('Trend insert error:', error)
      }
    }

    return NextResponse.json({ data: inserted, error: null })
  } catch (error) {
    console.error('Trend collection error:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to collect trends' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Write cron endpoint for all niches**

```typescript
// src/app/api/trends/collect-all/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchGoogleTrends } from '@/lib/trends/google-trends'

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get all distinct niches
  const { data: clients } = await supabase
    .from('clients')
    .select('niche')

  const niches = [...new Set(clients?.map((c) => c.niche) ?? [])]

  const results: { niche: string; count: number }[] = []

  for (const niche of niches) {
    const trends = await fetchGoogleTrends(niche)

    if (trends.length > 0) {
      let count = 0
      for (const row of trends) {
        const { data, error } = await supabase.from('trends').insert(row).select().single()
        if (data) count++
        // Skip duplicate key errors silently
      }
      results.push({ niche, count })
    }

    // Small delay between niches to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000))
  }

  return NextResponse.json({ data: results, error: null })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/trends/ && git commit -m "feat: add trend collection API routes (single + cron)"
```

---

### Task 17: Trends page UI

**Files:**
- Create: `src/components/trend-list.tsx`, `src/app/(dashboard)/clients/[id]/trends/page.tsx`

- [ ] **Step 1: Write trend list component**

```tsx
// src/components/trend-list.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Trend } from '@/types'
import { formatDate } from '@/lib/utils'

interface TrendListProps {
  clientId: string
  initialTrends: Trend[]
}

export function TrendList({ clientId, initialTrends }: TrendListProps) {
  const [trends, setTrends] = useState(initialTrends)
  const [loading, setLoading] = useState(false)

  async function collectTrends() {
    setLoading(true)
    try {
      const res = await fetch('/api/trends/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const { data, error } = await res.json()

      if (error) {
        toast.error('Erro ao coletar trends', { description: error })
        return
      }

      toast.success(`${data.length} trends coletados`)
      // Refresh by merging new trends on top
      setTrends((prev) => {
        const ids = new Set(prev.map((t) => t.id))
        const newOnes = (data as Trend[]).filter((t) => !ids.has(t.id))
        return [...newOnes, ...prev]
      })
    } catch {
      toast.error('Erro ao coletar trends')
    } finally {
      setLoading(false)
    }
  }

  const sourceColors: Record<string, string> = {
    google_trends: 'bg-blue-100 text-blue-700',
    youtube: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{trends.length} trends coletados</p>
        <Button onClick={collectTrends} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Coletando...' : 'Coletar Agora'}
        </Button>
      </div>

      {!trends.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-500 mb-4">Nenhuma trend coletada para este nicho</p>
            <Button onClick={collectTrends} disabled={loading}>
              Coletar Trends
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {trends.map((trend) => (
            <Card key={trend.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{trend.title}</span>
                    <Badge className={sourceColors[trend.source] ?? ''} variant="secondary">
                      {trend.source === 'google_trends' ? 'Google' : 'YouTube'}
                    </Badge>
                    {trend.relevance_score && (
                      <Badge variant="outline">{trend.relevance_score}</Badge>
                    )}
                  </div>
                  {trend.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{trend.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{formatDate(trend.collected_at)}</span>
                  {trend.url && (
                    <a href={trend.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write trends page**

```tsx
// src/app/(dashboard)/clients/[id]/trends/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TrendList } from '@/components/trend-list'
import type { Trend } from '@/types'

export default async function TrendsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, niche')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const { data: trends } = await supabase
    .from('trends')
    .select('*')
    .eq('niche', client.niche)
    .order('collected_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Trends — {client.name}</h1>
        <p className="text-slate-500 mt-1">Nicho: {client.niche}</p>
      </div>
      <TrendList clientId={id} initialTrends={(trends ?? []) as Trend[]} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/trend-list.tsx src/app/(dashboard)/clients/[id]/trends/ && git commit -m "feat: add trends page with collect button"
```

---

## Chunk 4: AI Calendar Generation

### Task 18: AI prompt builder

**Files:**
- Create: `src/lib/ai/prompt.ts`

- [ ] **Step 1: Write prompt builder**

```typescript
// src/lib/ai/prompt.ts
import type { Client, Trend } from '@/types'

export function buildCalendarPrompt(client: Client, trends: Trend[], startDate: string): { system: string; user: string } {
  const activeSocials = Object.entries(client.social_networks || {})
    .filter(([, active]) => active)
    .map(([name]) => name)
    .join(', ')

  const trendsText = trends.length > 0
    ? trends.map((t) => `- [${t.source}] ${t.title}${t.relevance_score ? ` (relevância: ${t.relevance_score})` : ''}`).join('\n')
    : 'Nenhuma trend recente coletada.'

  const system = `Você é um estrategista de conteúdo em vídeo para uma agência de marketing.
Você cria calendários de conteúdo de 14 dias para marcas de varejo entrando no digital.
Sempre responda em JSON válido seguindo o schema fornecido.
Responda em português brasileiro.`

  const user = `## Perfil do Cliente
- Nome: ${client.name}
- Nicho: ${client.niche}
- Público-alvo: ${client.target_audience}
- Tom de Voz: ${client.tone_of_voice}
- Produtos Principais: ${client.main_products}
- Redes Sociais Ativas: ${activeSocials || 'Nenhuma definida'}
- Conteúdo que Funcionou: ${client.content_examples || 'Nenhum exemplo fornecido'}

## Trends Atuais (${client.niche})
${trendsText}

## Tarefa
Gere um calendário de conteúdo de 14 dias começando em ${startDate}.
Cada dia pode ter 1-2 vídeos. Total: 14-21 vídeos.

Para cada vídeo forneça:
- title: título chamativo para o vídeo
- concept: 1-2 frases descrevendo a ideia
- hook: o que acontece nos primeiros 3 segundos para prender atenção
- script_outline: 3-5 tópicos para o roteiro (texto, separados por \\n)
- suggested_audio: sugestão de áudio trending ou estilo musical
- cta: call to action para o final
- format: "reels" | "shorts" | "tiktok"
- effort: 1 (simples/talking head) | 2 (médio/precisa b-roll) | 3 (complexo/produção)

Misture tipos de conteúdo: educativo, entretenimento, bastidores, vitrine de produto, baseado em trends.
Incorpore trends relevantes naturalmente, não force.
Equilibre os níveis de esforço — nem tudo deve ser esforço 3.

## Schema de Output
{
  "days": [
    {
      "day_number": 1,
      "date": "${startDate}",
      "videos": [
        {
          "title": "string",
          "concept": "string",
          "hook": "string",
          "script_outline": "string",
          "suggested_audio": "string",
          "cta": "string",
          "format": "reels | shorts | tiktok",
          "effort": 1
        }
      ]
    }
  ]
}

Responda APENAS com o JSON, sem texto adicional.`

  return { system, user }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/prompt.ts && git commit -m "feat: add AI calendar prompt builder"
```

---

### Task 19: Calendar response parser

**Files:**
- Create: `src/lib/ai/parse-calendar.ts`

- [ ] **Step 1: Write parser**

```typescript
// src/lib/ai/parse-calendar.ts
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
  // Strip markdown code blocks if present
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

    // Calculate scheduled_date from period_start + day_number - 1
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
        title: video.title || 'Sem título',
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/parse-calendar.ts && git commit -m "feat: add AI calendar response parser with field mapping"
```

---

### Task 20: Calendar generate API route

**Files:**
- Create: `src/app/api/calendar/generate/route.ts`

- [ ] **Step 1: Write generate endpoint**

```typescript
// src/app/api/calendar/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildCalendarPrompt } from '@/lib/ai/prompt'
import { parseCalendarResponse } from '@/lib/ai/parse-calendar'
import { randomUUID } from 'crypto'
import type { Client, Trend } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await request.json()

    // Fetch client
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ data: null, error: 'Client not found' }, { status: 404 })
    }

    // Fetch recent trends
    const { data: trends } = await supabase
      .from('trends')
      .select('*')
      .eq('niche', (client as Client).niche)
      .gte('collected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('collected_at', { ascending: false })
      .limit(30)

    // Calculate start date (next Monday)
    const today = new Date()
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + daysUntilMonday)
    const startDateStr = startDate.toISOString().split('T')[0]

    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 13)
    const endDateStr = endDate.toISOString().split('T')[0]

    // Build prompt
    const { system, user: userPrompt } = buildCalendarPrompt(
      client as Client,
      (trends ?? []) as Trend[],
      startDateStr
    )

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Retry once on parse failure with stricter prompt
    let parsed: ReturnType<typeof parseCalendarResponse> | null = null
    const calendarId = randomUUID()

    try {
      parsed = parseCalendarResponse(responseText, calendarId, clientId, startDateStr)
    } catch (parseError) {
      console.warn('First parse failed, retrying with stricter prompt...')
      const retryMessage = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 8000,
        system: system + '\nIMPORTANTE: Responda APENAS com JSON válido. Sem markdown, sem texto extra, sem blocos de código.',
        messages: [{ role: 'user', content: userPrompt }],
      })
      const retryText = retryMessage.content[0].type === 'text' ? retryMessage.content[0].text : ''
      parsed = parseCalendarResponse(retryText, calendarId, clientId, startDateStr)
    }

    const { items, parsed: aiOutput } = parsed

    // Delete existing draft calendars for this client (spec: "Draft already exists → warn/replace")
    const { data: existingDrafts } = await supabase
      .from('content_calendars')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'draft')

    for (const draft of existingDrafts ?? []) {
      await supabase.from('content_items').delete().eq('calendar_id', draft.id)
      await supabase.from('content_calendars').delete().eq('id', draft.id)
    }

    // Save calendar
    const { error: calError } = await supabase.from('content_calendars').insert({
      id: calendarId,
      client_id: clientId,
      generated_by: user.id,
      status: 'draft',
      period_start: startDateStr,
      period_end: endDateStr,
      raw_ai_response: aiOutput,
    })

    if (calError) {
      return NextResponse.json({ data: null, error: calError.message }, { status: 500 })
    }

    // Save content items
    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('content_items').insert(items)
      if (itemsError) {
        console.error('Content items insert error:', itemsError)
      }
    }

    return NextResponse.json({
      data: { calendarId, items, period_start: startDateStr, period_end: endDateStr },
      error: null,
    })
  } catch (error) {
    console.error('Calendar generation error:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to generate calendar' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/calendar/ && git commit -m "feat: add AI calendar generation API route"
```

---

### Task 21: Calendar server actions

**Files:**
- Create: `src/lib/actions/calendar.ts`, `src/lib/actions/content-items.ts`

- [ ] **Step 1: Write calendar commit action**

```typescript
// src/lib/actions/calendar.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function commitCalendar(calendarId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('content_calendars')
    .update({ status: 'committed' })
    .eq('id', calendarId)

  if (error) throw new Error(error.message)

  revalidatePath('/kanban')
}
```

- [ ] **Step 2: Write content item actions**

```typescript
// src/lib/actions/content-items.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateContentItem(
  id: string,
  updates: Record<string, unknown>
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('content_items')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/kanban')
}

export async function deleteContentItem(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/calendar.ts src/lib/actions/content-items.ts && git commit -m "feat: add calendar commit and content item server actions"
```

---

### Task 22: Calendar page UI

**Files:**
- Create: `src/components/calendar-grid.tsx`, `src/app/(dashboard)/clients/[id]/calendar/page.tsx`

- [ ] **Step 1: Write calendar grid component**

```tsx
// src/components/calendar-grid.tsx
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

const effortLabels: Record<number, string> = { 1: 'Simples', 2: 'Médio', 3: 'Complexo' }
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
        toast.error('Erro ao gerar calendário', { description: error })
        return
      }

      setItems(data.items)
      setCurrentCalendarId(data.calendarId)
      setCurrentStatus('draft')
      toast.success('Calendário gerado com sucesso!')
    } catch {
      toast.error('Erro ao gerar calendário')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCommit() {
    if (!currentCalendarId) return
    try {
      await commitCalendar(currentCalendarId)
      setCurrentStatus('committed')
      toast.success('Calendário enviado para o Kanban!')
    } catch {
      toast.error('Erro ao enviar para Kanban')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteContentItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Vídeo removido')
    } catch {
      toast.error('Erro ao remover vídeo')
    }
  }

  async function handleSaveEdit(id: string, updates: Partial<ContentItem>) {
    try {
      await updateContentItem(id, updates)
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
      setEditingId(null)
      toast.success('Vídeo atualizado')
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  // Group items by day
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
          {generating ? 'Gerando...' : items.length ? 'Regenerar Calendário' : 'Gerar Calendário'}
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
            <p className="text-slate-500 mb-4">Nenhum calendário gerado ainda</p>
            <p className="text-sm text-slate-400">Clique em "Gerar Calendário" para começar</p>
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
                    <p className="text-xs text-slate-400 py-2">Sem vídeos</p>
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
```

- [ ] **Step 2: Write calendar page**

```tsx
// src/app/(dashboard)/clients/[id]/calendar/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CalendarGrid } from '@/components/calendar-grid'
import type { ContentItem } from '@/types'

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!client) notFound()

  // Get latest calendar for this client
  const { data: calendar } = await supabase
    .from('content_calendars')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let items: ContentItem[] = []
  if (calendar) {
    const { data } = await supabase
      .from('content_items')
      .select('*')
      .eq('calendar_id', calendar.id)
      .order('day_number', { ascending: true })
      .order('kanban_order', { ascending: true })

    items = (data ?? []) as ContentItem[]
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Calendário — {client.name}</h1>
        <p className="text-slate-500 mt-1">Geração e edição de conteúdo com IA</p>
      </div>
      <CalendarGrid
        clientId={id}
        calendarId={calendar?.id ?? null}
        initialItems={items}
        status={calendar?.status ?? null}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/calendar-grid.tsx src/app/(dashboard)/clients/[id]/calendar/ && git commit -m "feat: add AI calendar page with draft editing"
```

---

## Chunk 5: Kanban Board

### Task 23: Kanban move API route

**Files:**
- Create: `src/app/api/kanban/move/route.ts`

- [ ] **Step 1: Write move endpoint**

```typescript
// src/app/api/kanban/move/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { KanbanStatus } from '@/types'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId, newStatus, newOrder } = await request.json() as {
      itemId: string
      newStatus: KanbanStatus
      newOrder: number
    }

    const { error } = await supabase
      .from('content_items')
      .update({
        kanban_status: newStatus,
        kanban_order: newOrder,
      })
      .eq('id', itemId)

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { itemId, newStatus, newOrder }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to move item' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/kanban/ && git commit -m "feat: add kanban move API route"
```

---

### Task 24: Kanban board components

**Files:**
- Create: `src/components/kanban-card.tsx`, `src/components/kanban-board.tsx`

- [ ] **Step 1: Write kanban card**

```tsx
// src/components/kanban-card.tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ContentItem } from '@/types'
import { formatDateShort, isOverdue } from '@/lib/utils'
import { cn } from '@/lib/utils'
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
```

- [ ] **Step 2: Write kanban board**

```tsx
// src/components/kanban-board.tsx
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
  type DragOverEvent,
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
        'flex flex-col w-72 flex-shrink-0 bg-slate-100 rounded-lg',
        isOver && 'bg-indigo-50'
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h3 className="font-medium text-sm text-slate-700">{label}</h3>
        <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
        {children}
      </div>
    </div>
  )
}

export function KanbanBoard({ initialItems, clientFilter }: KanbanBoardProps) {
  const [items, setItems] = useState(initialItems)
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting'>('connected')

  // Subscribe to realtime changes with polling fallback
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null

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
          // Fallback to polling every 30s
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

    // Determine new status — over could be a column id or an item id
    let newStatus: KanbanStatus
    const overColumn = KANBAN_COLUMNS.find((c) => c.key === overId)
    if (overColumn) {
      newStatus = overColumn.key
    } else {
      const overItem = items.find((i) => i.id === overId)
      newStatus = overItem?.kanban_status ?? 'to_record'
    }

    const newOrder = getColumnItems(newStatus).length

    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === activeId
          ? { ...item, kanban_status: newStatus, kanban_order: newOrder }
          : item
      )
    )

    // Persist
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
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          Reconectando... Atualizando a cada 30s
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4">
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/kanban-card.tsx src/components/kanban-board.tsx && git commit -m "feat: add kanban board with drag-and-drop and realtime"
```

---

### Task 25: Kanban pages

**Files:**
- Create: `src/app/(dashboard)/kanban/page.tsx`, `src/app/(dashboard)/kanban/[clientId]/page.tsx`

- [ ] **Step 1: Write global kanban page**

```tsx
// src/app/(dashboard)/kanban/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban-board'
import type { ContentItem } from '@/types'

export default async function KanbanPage() {
  const supabase = await createServerSupabaseClient()

  const { data: items } = await supabase
    .from('content_items')
    .select('*')
    .in('kanban_status', ['to_record', 'editing', 'review', 'approval', 'published'])
    .order('kanban_order', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Kanban</h1>
        <p className="text-slate-500 mt-1">Quadro de produção — todos os clientes</p>
      </div>
      <KanbanBoard initialItems={(items ?? []) as ContentItem[]} />
    </div>
  )
}
```

- [ ] **Step 2: Write client-filtered kanban page**

```tsx
// src/app/(dashboard)/kanban/[clientId]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { KanbanBoard } from '@/components/kanban-board'
import type { ContentItem } from '@/types'

export default async function ClientKanbanPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single()

  if (!client) notFound()

  const { data: items } = await supabase
    .from('content_items')
    .select('*')
    .eq('client_id', clientId)
    .order('kanban_order', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Kanban — {client.name}</h1>
        <p className="text-slate-500 mt-1">Quadro de produção</p>
      </div>
      <KanbanBoard initialItems={(items ?? []) as ContentItem[]} clientFilter={clientId} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/kanban/ && git commit -m "feat: add kanban pages (global and client-filtered)"
```

---

## Chunk 6: Dashboard + Settings

### Task 26: Dashboard page

**Files:**
- Create: `src/components/dashboard-stats.tsx`, `src/app/(dashboard)/dashboard/page.tsx` (replace placeholder)

- [ ] **Step 1: Write dashboard stats component**

```tsx
// src/components/dashboard-stats.tsx
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
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Video className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{items.length}</p>
                <p className="text-sm text-slate-500">Total de vídeos</p>
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
                <p className="text-sm text-slate-500">Em produção</p>
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

      {/* Overdue Alerts */}
      {overdueItems.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Vídeos Atrasados
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

      {/* Per-Client Summary */}
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
                    <Badge variant="outline">{clientItems.length} vídeos</Badge>
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
```

- [ ] **Step 2: Update dashboard page**

```tsx
// src/app/(dashboard)/dashboard/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard-stats'
import type { Client, ContentItem } from '@/types'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: clients }, { data: allItems }] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase.from('content_items').select('*').order('scheduled_date', { ascending: true }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Visão geral da produção</p>
      </div>
      <DashboardStats
        clients={(clients ?? []) as Client[]}
        items={(allItems ?? []) as ContentItem[]}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard-stats.tsx src/app/(dashboard)/dashboard/page.tsx && git commit -m "feat: add dashboard with stats and overdue alerts"
```

---

### Task 27: Settings page (basic)

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Write basic settings page**

```tsx
// src/app/(dashboard)/settings/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1">Gerenciamento da equipe</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>
            Para convidar novos membros, use o painel do Supabase (Authentication → Invite User).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(profiles as Profile[] ?? []).map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg border border-slate-200"
              >
                <div>
                  <p className="font-medium text-slate-900">{profile.full_name}</p>
                </div>
                <Badge variant="secondary">{profile.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/settings/ && git commit -m "feat: add basic settings page with team list"
```

---

### Task 28: Final wiring and verification

- [ ] **Step 1: Verify all routes exist**

Run the dev server and manually check that all routes render without errors:

```bash
npm run dev
```

Check: `/login`, `/dashboard`, `/clients`, `/clients/new`, `/kanban`, `/settings`

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes without TypeScript errors.

- [ ] **Step 3: Final commit**

```bash
git add -A && git commit -m "chore: final wiring and build verification"
```

---

## Summary

| Chunk | Tasks | What It Delivers |
|---|---|---|
| 1 | 1-8 | Scaffolding, DB schema, auth, sidebar layout |
| 2 | 9-13 | Full client CRUD (create, edit, delete, list, detail) |
| 3 | 14-17 | Trend collection (Google Trends + YouTube) with UI |
| 4 | 18-22 | AI calendar generation with draft editing |
| 5 | 23-25 | Kanban board with drag-and-drop + realtime |
| 6 | 26-28 | Dashboard overview + settings + verification |

Total: 28 tasks across 6 chunks. Each chunk produces working, testable functionality.
