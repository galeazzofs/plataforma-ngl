-- Fix RLS policies to use auth.uid() instead of auth.role()
-- auth.role() can be unreliable in some Supabase versions

-- PROFILES
DROP POLICY IF EXISTS "Authenticated users full access" ON profiles;
CREATE POLICY "Authenticated users full access" ON profiles
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- CLIENTS
DROP POLICY IF EXISTS "Authenticated users full access" ON clients;
CREATE POLICY "Authenticated users full access" ON clients
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- TRENDS
DROP POLICY IF EXISTS "Authenticated users full access" ON trends;
CREATE POLICY "Authenticated users full access" ON trends
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- CONTENT CALENDARS
DROP POLICY IF EXISTS "Authenticated users full access" ON content_calendars;
CREATE POLICY "Authenticated users full access" ON content_calendars
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- CONTENT ITEMS
DROP POLICY IF EXISTS "Authenticated users full access" ON content_items;
CREATE POLICY "Authenticated users full access" ON content_items
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
