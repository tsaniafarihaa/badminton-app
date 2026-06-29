import { supabase, DBPlayer, DBDoublesPair, DBMatch, DBTournamentState } from '../lib/supabase';
import { Player, DoublesPair, Match, TournamentData, ShiftGroup, Category, TournamentRound, MatchScore } from '../types';

// Convert DB player to app player
function dbToPlayer(db: DBPlayer): Player {
  return {
    id: db.id,
    name: db.name,
    company: db.company as Player['company'],
    shiftGroup: db.shift_group as ShiftGroup,
    category: db.category as Category,
    seed: db.seed,
  };
}

// Convert app player to DB format
function playerToDb(player: Omit<Player, 'id'> | Player): Omit<DBPlayer, 'id' | 'created_at'> {
  return {
    name: player.name,
    company: player.company,
    shift_group: player.shiftGroup,
    category: player.category,
    seed: player.seed || false,
  };
}

// Convert DB doubles pair to app doubles pair
async function dbToDoublesPair(db: DBDoublesPair): Promise<DoublesPair> {
  const { data: player1Data } = await supabase
    .from('players')
    .select('*')
    .eq('id', db.player1_id)
    .single();

  const { data: player2Data } = await supabase
    .from('players')
    .select('*')
    .eq('id', db.player2_id)
    .single();

  return {
    id: db.id,
    player1: dbToPlayer(player1Data as DBPlayer),
    player2: dbToPlayer(player2Data as DBPlayer),
    seed: db.seed,
  };
}

// Convert DB match to app match (needs player/pair lookups)
async function dbToMatch(db: DBMatch, players: Player[], pairs: DoublesPair[]): Promise<Match> {
  let team1: DoublesPair | Player | undefined;
  let team2: DoublesPair | Player | undefined;

  if (db.team1_id) {
    if (db.team1_type === 'pair') {
      team1 = pairs.find(p => p.id === db.team1_id);
    } else {
      team1 = players.find(p => p.id === db.team1_id);
    }
  }

  if (db.team2_id) {
    if (db.team2_type === 'pair') {
      team2 = pairs.find(p => p.id === db.team2_id);
    } else {
      team2 = players.find(p => p.id === db.team2_id);
    }
  }

  return {
    id: db.id,
    matchNumber: db.match_number,
    category: db.category as Category,
    round: db.round as TournamentRound,
    team1,
    team2,
    winner: db.winner_id || undefined,
    scores: db.scores as MatchScore[],
    scheduledDate: db.scheduled_date || undefined,
    scheduledTime: db.scheduled_time || undefined,
    court: db.court || undefined,
    status: db.status as 'pending' | 'scheduled' | 'completed',
    week: db.week || undefined,
    nextMatchId: db.next_match_id || undefined,
    nextMatchSlot: db.next_match_slot as 1 | 2 | undefined,
  };
}

// Load all tournament data from Supabase
export async function loadTournamentDataFromDB(): Promise<TournamentData> {
  try {
    // Load players
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: true });

    if (playersError) throw playersError;

    const players: Player[] = (playersData || []).map(dbToPlayer);

    // Load doubles pairs
    const { data: pairsData, error: pairsError } = await supabase
      .from('doubles_pairs')
      .select('*')
      .order('created_at', { ascending: true });

    if (pairsError) throw pairsError;

    // Convert pairs with player data
    const doublesPairs: DoublesPair[] = [];
    for (const dbPair of pairsData || []) {
      const pair = await dbToDoublesPair(dbPair);
      doublesPairs.push(pair);
    }

    // Load matches
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .order('match_number', { ascending: true });

    if (matchesError) throw matchesError;

    // Convert matches
    const matches: Match[] = [];
    for (const dbMatch of matchesData || []) {
      const match = await dbToMatch(dbMatch, players, doublesPairs);
      matches.push(match);
    }

    // Load tournament state
    const { data: stateData, error: stateError } = await supabase
      .from('tournament_state')
      .select('*')
      .limit(1)
      .single();

    const tournamentState = stateData as DBTournamentState;

    // Women's singles players
    const womenSinglePlayers = players.filter(p => p.category === 'Single Putri');

    return {
      players,
      doublesPairs,
      womenSinglePlayers,
      matches,
      schedules: [],
      currentWeek: tournamentState?.current_week || 1,
      drawCompleted: tournamentState?.draw_completed || false,
      scheduleGenerated: tournamentState?.schedule_generated || false,
    };
  } catch (error) {
    console.error('Error loading tournament data:', error);
    return {
      players: [],
      doublesPairs: [],
      womenSinglePlayers: [],
      matches: [],
      schedules: [],
      currentWeek: 1,
      drawCompleted: false,
      scheduleGenerated: false,
    };
  }
}

// Save player to database
export async function savePlayerToDB(player: Player): Promise<Player | null> {
  const { data, error } = await supabase
    .from('players')
    .insert(playerToDb(player))
    .select()
    .single();

  if (error) {
    console.error('Error saving player:', error);
    return null;
  }

  return dbToPlayer(data as DBPlayer);
}

// Update player in database
export async function updatePlayerInDB(player: Player): Promise<boolean> {
  const { error } = await supabase
    .from('players')
    .update(playerToDb(player))
    .eq('id', player.id);

  if (error) {
    console.error('Error updating player:', error);
    return false;
  }

  return true;
}

// Delete player from database
export async function deletePlayerFromDB(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting player:', error);
    return false;
  }

  return true;
}

// Import multiple players
export async function importPlayersToDB(players: Omit<Player, 'id'>[]): Promise<Player[]> {
  const playersToInsert = players.map(p => playerToDb(p));

  const { data, error } = await supabase
    .from('players')
    .insert(playersToInsert)
    .select();

  if (error) {
    console.error('Error importing players:', error);
    return [];
  }

  return (data || []).map(dbToPlayer);
}

// Save doubles pair to database
export async function saveDoublesPairToDB(pair: DoublesPair): Promise<DoublesPair | null> {
  const { data, error } = await supabase
    .from('doubles_pairs')
    .insert({
      id: pair.id,
      player1_id: pair.player1.id,
      player2_id: pair.player2.id,
      seed: pair.seed || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving doubles pair:', error);
    return null;
  }

  return pair;
}

// Save match to database
export async function saveMatchToDB(match: Match): Promise<Match | null> {
  const team1Type = match.team1 && 'player1' in match.team1 ? 'pair' : 'player';
  const team2Type = match.team2 && 'player1' in match.team2 ? 'pair' : 'player';
  const team1Id = match.team1 ? (match.team1 as DoublesPair).id || (match.team1 as Player).id : null;
  const team2Id = match.team2 ? (match.team2 as DoublesPair).id || (match.team2 as Player).id : null;

  const { data, error } = await supabase
    .from('matches')
    .upsert({
      id: match.id,
      match_number: match.matchNumber,
      category: match.category,
      round: match.round,
      team1_id: team1Id,
      team1_type: team1Type,
      team2_id: team2Id,
      team2_type: team2Type,
      winner_id: match.winner || null,
      scores: match.scores,
      scheduled_date: match.scheduledDate || null,
      scheduled_time: match.scheduledTime || null,
      court: match.court || null,
      status: match.status,
      week: match.week || null,
      next_match_id: match.nextMatchId || null,
      next_match_slot: match.nextMatchSlot || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving match:', error);
    return null;
  }

  return match;
}

// Save multiple matches
export async function saveMatchesToDB(matches: Match[]): Promise<boolean> {
  const matchesToSave = matches.map(match => {
    const team1Type = match.team1 && 'player1' in match.team1 ? 'pair' : 'player';
    const team2Type = match.team2 && 'player1' in match.team2 ? 'pair' : 'player';
    const team1Id = match.team1 ? (match.team1 as DoublesPair).id || (match.team1 as Player).id : null;
    const team2Id = match.team2 ? (match.team2 as DoublesPair).id || (match.team2 as Player).id : null;

    return {
      id: match.id,
      match_number: match.matchNumber,
      category: match.category,
      round: match.round,
      team1_id: team1Id,
      team1_type: team1Type,
      team2_id: team2Id,
      team2_type: team2Type,
      winner_id: match.winner || null,
      scores: match.scores,
      scheduled_date: match.scheduledDate || null,
      scheduled_time: match.scheduledTime || null,
      court: match.court || null,
      status: match.status,
      week: match.week || null,
      next_match_id: match.nextMatchId || null,
      next_match_slot: match.nextMatchSlot || null,
    };
  });

  const { error } = await supabase
    .from('matches')
    .upsert(matchesToSave);

  if (error) {
    console.error('Error saving matches:', error);
    return false;
  }

  return true;
}

// Update tournament state
export async function updateTournamentState(state: {
  drawCompleted?: boolean;
  scheduleGenerated?: boolean;
  currentWeek?: number;
}): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (state.drawCompleted !== undefined) updateData.draw_completed = state.drawCompleted;
  if (state.scheduleGenerated !== undefined) updateData.schedule_generated = state.scheduleGenerated;
  if (state.currentWeek !== undefined) updateData.current_week = state.currentWeek;

  const { error } = await supabase
    .from('tournament_state')
    .update(updateData)
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

  if (error) {
    console.error('Error updating tournament state:', error);
    return false;
  }

  return true;
}

// Clear all tournament data (reset)
export async function clearTournamentData(): Promise<boolean> {
  try {
    // Delete all matches
    await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Delete all doubles pairs
    await supabase.from('doubles_pairs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Delete all players
    await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Reset tournament state
    await updateTournamentState({
      drawCompleted: false,
      scheduleGenerated: false,
      currentWeek: 1,
    });

    return true;
  } catch (error) {
    console.error('Error clearing tournament data:', error);
    return false;
  }
}

// Save doubles pairs
export async function saveDoublesPairsToDB(pairs: DoublesPair[]): Promise<boolean> {
  const pairsToSave = pairs.map(pair => ({
    id: pair.id,
    player1_id: pair.player1.id,
    player2_id: pair.player2.id,
    seed: pair.seed || false,
  }));

  const { error } = await supabase
    .from('doubles_pairs')
    .insert(pairsToSave);

  if (error) {
    console.error('Error saving doubles pairs:', error);
    return false;
  }

  return true;
}
