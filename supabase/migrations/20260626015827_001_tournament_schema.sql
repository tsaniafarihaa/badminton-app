/*
# Tournament Management Schema

1. New Tables
- `players` - Store all tournament participants
  - id (uuid, primary key)
  - name (text, not null)
  - company (text, not null)
  - shift_group (text, not null)
  - category (text, not null) - 'Ganda Putra' or 'Single Putri'
  - seed (boolean, default false)
  - created_at (timestamp)
  
- `doubles_pairs` - Store paired doubles teams
  - id (uuid, primary key)
  - player1_id (uuid, references players)
  - player2_id (uuid, references players)
  - seed (boolean, default false)
  - created_at (timestamp)
  
- `matches` - Store all tournament matches
  - id (uuid, primary key)
  - match_number (integer)
  - category (text, not null)
  - round (text, not null) - Preliminary, Round of 16, Quarter Final, Semi Final, Final
  - team1_id (uuid, nullable) - references doubles_pairs or players
  - team1_type (text) - 'pair' or 'player'
  - team2_id (uuid, nullable)
  - team2_type (text)
  - winner_id (uuid, nullable)
  - scores (jsonb, default '[]')
  - scheduled_date (date, nullable)
  - scheduled_time (text, nullable)
  - court (integer, nullable)
  - status (text, default 'pending') - pending, scheduled, completed
  - week (integer, nullable)
  - next_match_id (uuid, nullable)
  - next_match_slot (integer, nullable)
  - created_at (timestamp)

- `tournament_state` - Store overall tournament progress
  - id (uuid, primary key, single row)
  - draw_completed (boolean, default false)
  - schedule_generated (boolean, default false)
  - current_week (integer, default 1)
  - updated_at (timestamp)

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated full CRUD (single-tenant, no auth).
*/

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  shift_group text NOT NULL,
  category text NOT NULL,
  seed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);

-- Doubles pairs table
CREATE TABLE IF NOT EXISTS doubles_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player2_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doubles_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pairs" ON doubles_pairs;
CREATE POLICY "anon_select_pairs" ON doubles_pairs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pairs" ON doubles_pairs;
CREATE POLICY "anon_insert_pairs" ON doubles_pairs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pairs" ON doubles_pairs;
CREATE POLICY "anon_update_pairs" ON doubles_pairs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pairs" ON doubles_pairs;
CREATE POLICY "anon_delete_pairs" ON doubles_pairs FOR DELETE
  TO anon, authenticated USING (true);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_number integer NOT NULL,
  category text NOT NULL,
  round text NOT NULL,
  team1_id uuid,
  team1_type text,
  team2_id uuid,
  team2_type text,
  winner_id uuid,
  scores jsonb DEFAULT '[]'::jsonb,
  scheduled_date date,
  scheduled_time text,
  court integer,
  status text NOT NULL DEFAULT 'pending',
  week integer,
  next_match_id uuid,
  next_match_slot integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_matches" ON matches;
CREATE POLICY "anon_select_matches" ON matches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_matches" ON matches;
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_matches" ON matches;
CREATE POLICY "anon_delete_matches" ON matches FOR DELETE
  TO anon, authenticated USING (true);

-- Tournament state table (single row)
CREATE TABLE IF NOT EXISTS tournament_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_completed boolean NOT NULL DEFAULT false,
  schedule_generated boolean NOT NULL DEFAULT false,
  current_week integer NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tournament_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_state" ON tournament_state;
CREATE POLICY "anon_select_state" ON tournament_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_state" ON tournament_state;
CREATE POLICY "anon_insert_state" ON tournament_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_state" ON tournament_state;
CREATE POLICY "anon_update_state" ON tournament_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Insert initial tournament state if not exists
INSERT INTO tournament_state (id, draw_completed, schedule_generated, current_week)
SELECT gen_random_uuid(), false, false, 1
WHERE NOT EXISTS (SELECT 1 FROM tournament_state);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_players_category ON players(category);
CREATE INDEX IF NOT EXISTS idx_matches_category ON matches(category);
CREATE INDEX IF NOT EXISTS idx_matches_week ON matches(week);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_doubles_pairs_players ON doubles_pairs(player1_id, player2_id);
