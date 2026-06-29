import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DBPlayer {
  id: string;
  name: string;
  company: string;
  shift_group: string;
  category: string;
  seed: boolean;
  created_at: string;
}

export interface DBDoublesPair {
  id: string;
  player1_id: string;
  player2_id: string;
  seed: boolean;
  created_at: string;
}

export interface DBMatch {
  id: string;
  match_number: number;
  category: string;
  round: string;
  team1_id: string | null;
  team1_type: string | null;
  team2_id: string | null;
  team2_type: string | null;
  winner_id: string | null;
  scores: Array<{
    game1Team1: number;
    game1Team2: number;
    game2Team1: number;
    game2Team2: number;
    game3Team1?: number;
    game3Team2?: number;
  }>;
  scheduled_date: string | null;
  scheduled_time: string | null;
  court: number | null;
  status: string;
  week: number | null;
  next_match_id: string | null;
  next_match_slot: number | null;
  created_at: string;
}

export interface DBTournamentState {
  id: string;
  draw_completed: boolean;
  schedule_generated: boolean;
  current_week: number;
  updated_at: string;
}
