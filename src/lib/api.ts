import { supabase } from './supabase'

// Type definitions (matching the store types)
interface Tournament {
  id: string
  room_code: string
  name: string
  status: 'lobby' | 'picking' | 'playing' | 'scoring' | 'completed'
  num_games: number
  time_est_min: number
  referee_id: string
  current_pick_team: string | null
  created_at: string
}

interface Player {
  id: string
  tournament_id: string
  name: string
  device_id: string
  team_id: string | null
  role: 'referee' | 'player' | 'spectator'
  is_leader: boolean
  created_at: string
}

// API Functions

export async function createTournament(
  name: string,
  roomCode: string,
  numGames: number,
  refereeName: string,
  deviceId: string
): Promise<{ tournament: Tournament; player: Player }> {
  // Validate room code
  if (!roomCode || roomCode.length > 5 || !/^[A-Z0-9]+$/.test(roomCode)) {
    throw new Error('Room code must be 1-5 characters, alphanumeric, and uppercase');
  }

  // Check uniqueness
  const { data: existing } = await supabase
    .from('tournaments')
    .select('id')
    .eq('room_code', roomCode)
    .neq('status', 'completed')
    .single();

  if (existing) {
    throw new Error('Room code already exists');
  }

  // Insert tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .insert({
      name,
      room_code: roomCode,
      num_games: numGames,
      time_est_min: numGames * 20,
      status: 'lobby',
      current_pick_team: null
    })
    .select()
    .single();

  if (tournamentError || !tournament) {
    throw new Error(`Failed to create tournament: ${tournamentError?.message}`);
  }

  // Insert referee player
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      tournament_id: tournament.id,
      name: refereeName,
      device_id: deviceId,
      role: 'referee',
      is_leader: true,
      team_id: null
    })
    .select()
    .single();

  if (playerError || !player) {
    throw new Error(`Failed to create referee: ${playerError?.message}`);
  }

  // Update tournament with referee_id
  const { error: updateError } = await supabase
    .from('tournaments')
    .update({ referee_id: player.id })
    .eq('id', tournament.id);

  if (updateError) {
    throw new Error(`Failed to set referee: ${updateError.message}`);
  }

  return {
    tournament: { ...tournament, referee_id: player.id },
    player
  };
}

export async function validateRoomCode(
  roomCode: string
): Promise<{ valid: boolean; error?: string; tournament?: Tournament }> {
  if (!roomCode || roomCode.length > 5 || !/^[A-Z0-9]+$/.test(roomCode)) {
    return { valid: false, error: 'Invalid room code format' };
  }

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('room_code', roomCode)
    .neq('status', 'completed')
    .single();

  if (error || !tournament) {
    return { valid: false, error: 'Room not found' };
  }

  return { valid: true, tournament };
}

export async function joinTournament(
  roomCode: string,
  playerName: string,
  deviceId: string,
  role: 'player' | 'spectator'
): Promise<{ tournament: Tournament; player: Player }> {
  // Validate room code and get tournament
  const validation = await validateRoomCode(roomCode);
  if (!validation.valid || !validation.tournament) {
    throw new Error(validation.error || 'Room not found');
  }

  const tournament = validation.tournament;

  // Check tournament status
  if (tournament.status !== 'lobby') {
    throw new Error('Tournament has already started');
  }

  // Check for existing player with same device_id (reconnection)
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('*')
    .eq('tournament_id', tournament.id)
    .eq('device_id', deviceId)
    .single();

  if (existingPlayer) {
    return { tournament, player: existingPlayer };
  }

  // Insert new player
  const { data: player, error } = await supabase
    .from('players')
    .insert({
      tournament_id: tournament.id,
      name: playerName,
      device_id: deviceId,
      role,
      is_leader: false,
      team_id: null
    })
    .select()
    .single();

  if (error || !player) {
    throw new Error(`Failed to join tournament: ${error?.message}`);
  }

  return { tournament, player };
}

export async function reconnectPlayer(
  deviceId: string
): Promise<{ tournament: Tournament; player: Player } | null> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      tournament:tournaments!inner(*)
    `)
    .eq('device_id', deviceId)
    .neq('tournament.status', 'completed')
    .single();

  if (error || !data) {
    return null;
  }

  return {
    tournament: data.tournament as Tournament,
    player: data as Player
  };
}