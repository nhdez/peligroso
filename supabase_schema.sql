-- ============================================================================
-- PELIGROSO (TRUCO PATAGÓNICO) - SUPABASE DATABASE SCHEMA & RLS MIGRATION
-- ============================================================================

-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'player')),
  elo_rating INTEGER NOT NULL DEFAULT 1200,
  matches_played INTEGER NOT NULL DEFAULT 0,
  matches_won INTEGER NOT NULL DEFAULT 0,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  selected_deck_id TEXT NOT NULL DEFAULT 'classic-spanish',
  custom_mat_url TEXT DEFAULT '',
  mat_opacity REAL DEFAULT 0.85,
  country_code TEXT NOT NULL DEFAULT 'AR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if table was created previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'AR';

-- 2. Create Deck Themes Table
CREATE TABLE IF NOT EXISTS public.deck_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  card_back_url TEXT NOT NULL,
  card_faces JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_themes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Profiles Table
-- Allow anyone (public/authenticated) to read user profiles for leaderboards
CREATE POLICY "Allow public read access for profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile data (or admins to manage profiles)
CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. RLS Policies for Deck Themes Table
-- Allow anyone to view available card decks
CREATE POLICY "Allow public read access for deck_themes"
  ON public.deck_themes FOR SELECT
  USING (true);

-- Allow admins to insert or delete deck themes
CREATE POLICY "Allow admins to create deck themes"
  ON public.deck_themes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Allow admins to delete deck themes"
  ON public.deck_themes FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Trigger to Automatically Provision Profile on User Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, elo_rating)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'Player_' || substr(NEW.id::text, 1, 6)),
    'player',
    1200
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Insert Seed Data for Default Card Decks
INSERT INTO public.deck_themes (id, name, description, card_back_url)
VALUES
  ('classic-spanish', 'Clásico Español', 'Mazo tradicional de cartas españolas', 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)'),
  ('gold-royal', 'Royal Gold 24K', 'Mazo dorado con acabados reales', 'linear-gradient(135deg, #b45309 0%, #78350f 100%)'),
  ('cyber-neon', 'Cyberpunk Neon', 'Mazo futurista con efectos de neón', 'linear-gradient(135deg, #701a75 0%, #4c1d95 100%)')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. SUPABASE OBJECT STORAGE BUCKET & RLS POLICIES
-- ============================================================================

-- Create public storage bucket 'peligroso-storage'
INSERT INTO storage.buckets (id, name, public)
VALUES ('peligroso-storage', 'peligroso-storage', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy 1: Allow public read access to uploaded assets
CREATE POLICY "Public Read Access for peligroso-storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'peligroso-storage');

-- Policy 2: Allow authenticated users to upload files
CREATE POLICY "Public & Authenticated Upload Access for peligroso-storage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'peligroso-storage');

-- ============================================================================
-- 9. LOBBY & IN-GAME CHAT MESSAGES PERSISTENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lobby_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT,
  username TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'AR',
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  sender_id TEXT,
  username TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'AR',
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lobby_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Lobby Messages" ON public.lobby_messages;
CREATE POLICY "Public Read Lobby Messages" ON public.lobby_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Lobby Messages" ON public.lobby_messages;
CREATE POLICY "Public Insert Lobby Messages" ON public.lobby_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Game Chat Messages" ON public.game_chat_messages;
CREATE POLICY "Public Read Game Chat Messages" ON public.game_chat_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Game Chat Messages" ON public.game_chat_messages;
CREATE POLICY "Public Insert Game Chat Messages" ON public.game_chat_messages FOR INSERT WITH CHECK (true);


