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

-- Deduplicate by niche + source + title (one entry per trend, regardless of date)
CREATE UNIQUE INDEX idx_trends_unique ON trends(niche, source, title);

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
