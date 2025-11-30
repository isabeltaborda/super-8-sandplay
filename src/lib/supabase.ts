import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Tournament = {
  id: string;
  name: string;
  mode: string;
  dispute_model: 'wins' | 'games';
  players: string[];
  created_at: string;
  user_id: string;
  is_fixed: boolean;
  pairing_type?: 'manual' | 'random';
};

export type Match = {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  team1_score: number;
  team2_score: number;
  team1_players: number[];
  team2_players: number[];
  created_at: string;
};
