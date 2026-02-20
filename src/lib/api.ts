import { supabase } from './supabase'
import type { Tournament, Player, Team, LeaderVote } from '../types'

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

// Sprint 2: Team and Lobby Management

export async function fetchLobbyState(
  tournamentId: string
): Promise<{ tournament: Tournament; players: Player[]; teams: Team[]; votes: LeaderVote[] }> {
  // Fetch tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tournamentError || !tournament) {
    throw new Error(`Failed to fetch tournament: ${tournamentError?.message}`);
  }

  // Fetch all players in tournament
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at');

  if (playersError) {
    throw new Error(`Failed to fetch players: ${playersError.message}`);
  }

  // Fetch all teams in tournament
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at');

  if (teamsError) {
    throw new Error(`Failed to fetch teams: ${teamsError.message}`);
  }

  // Fetch all leader votes for teams in this tournament
  let votes: LeaderVote[] = [];
  if (teams && teams.length > 0) {
    const teamIds = teams.map(team => team.id);
    const { data: votesData, error: votesError } = await supabase
      .from('leader_votes')
      .select('*')
      .in('team_id', teamIds);

    if (votesError) {
      throw new Error(`Failed to fetch votes: ${votesError.message}`);
    }
    
    votes = votesData || [];
  }

  return {
    tournament,
    players: players || [],
    teams: teams || [],
    votes
  };
}

export async function createTeam(
  tournamentId: string,
  name: string
): Promise<Team> {
  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      tournament_id: tournamentId,
      name,
      total_points: 0
    })
    .select()
    .single();

  if (error || !team) {
    throw new Error(`Failed to create team: ${error?.message}`);
  }

  return team;
}

export async function updateTeamName(
  teamId: string,
  name: string
): Promise<Team> {
  const { data: team, error } = await supabase
    .from('teams')
    .update({ name })
    .eq('id', teamId)
    .select()
    .single();

  if (error || !team) {
    throw new Error(`Failed to update team name: ${error?.message}`);
  }

  return team;
}

export async function joinTeam(
  playerId: string,
  teamId: string
): Promise<Player> {
  // First get the player's current team_id to clean up votes from old team
  const { data: currentPlayer } = await supabase
    .from('players')
    .select('team_id')
    .eq('id', playerId)
    .single();

  // Update player's team_id
  const { data: player, error } = await supabase
    .from('players')
    .update({ 
      team_id: teamId,
      is_leader: false // Reset leader status when joining new team
    })
    .eq('id', playerId)
    .select()
    .single();

  if (error || !player) {
    throw new Error(`Failed to join team: ${error?.message}`);
  }

  // Delete any leader_votes where voter_id = playerId from old team
  if (currentPlayer?.team_id && currentPlayer.team_id !== teamId) {
    await supabase
      .from('leader_votes')
      .delete()
      .eq('team_id', currentPlayer.team_id)
      .eq('voter_id', playerId);
  }

  return player;
}

export async function leaveTeam(
  playerId: string
): Promise<Player> {
  // Get current player info to know which team they're leaving
  const { data: currentPlayer } = await supabase
    .from('players')
    .select('team_id')
    .eq('id', playerId)
    .single();

  // Update player to remove team
  const { data: player, error } = await supabase
    .from('players')
    .update({ 
      team_id: null,
      is_leader: false
    })
    .eq('id', playerId)
    .select()
    .single();

  if (error || !player) {
    throw new Error(`Failed to leave team: ${error?.message}`);
  }

  // Delete votes they cast or received from their old team
  if (currentPlayer?.team_id) {
    await supabase
      .from('leader_votes')
      .delete()
      .eq('team_id', currentPlayer.team_id)
      .or(`voter_id.eq.${playerId},candidate_id.eq.${playerId}`);
  }

  return player;
}

export async function voteForLeader(
  teamId: string,
  voterId: string,
  candidateId: string
): Promise<{ votes: LeaderVote[]; leaderId: string | null }> {
  // Upsert the vote
  const { error: voteError } = await supabase
    .from('leader_votes')
    .upsert({
      team_id: teamId,
      voter_id: voterId,
      candidate_id: candidateId
    }, {
      onConflict: 'team_id,voter_id'
    });

  if (voteError) {
    throw new Error(`Failed to vote for leader: ${voteError.message}`);
  }

  // Get all votes for this team
  const { data: votes, error: votesError } = await supabase
    .from('leader_votes')
    .select('*')
    .eq('team_id', teamId);

  if (votesError) {
    throw new Error(`Failed to fetch votes: ${votesError.message}`);
  }

  // Get team member count
  const { data: teamMembers, error: membersError } = await supabase
    .from('players')
    .select('id')
    .eq('team_id', teamId);

  if (membersError) {
    throw new Error(`Failed to fetch team members: ${membersError.message}`);
  }

  const memberCount = teamMembers?.length || 0;
  const votesNeeded = Math.floor(memberCount / 2) + 1;

  // Count votes per candidate
  const voteCounts = votes?.reduce((acc, vote) => {
    acc[vote.candidate_id] = (acc[vote.candidate_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Check if any candidate has majority
  let newLeaderId: string | null = null;
  for (const [candidateId, voteCount] of Object.entries(voteCounts)) {
    if (typeof voteCount === 'number' && voteCount >= votesNeeded) {
      newLeaderId = candidateId;
      break;
    }
  }

  // Update leader status if there's a new leader
  if (newLeaderId) {
    // Set all team members to not leader
    await supabase
      .from('players')
      .update({ is_leader: false })
      .eq('team_id', teamId);

    // Set the new leader
    await supabase
      .from('players')
      .update({ is_leader: true })
      .eq('id', newLeaderId);
  }

  return {
    votes: votes || [],
    leaderId: newLeaderId
  };
}

export async function startTournament(
  tournamentId: string
): Promise<Tournament> {
  // Get tournament with teams and players for validation
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      *,
      players(*)
    `)
    .eq('tournament_id', tournamentId);

  if (teamsError) {
    throw new Error(`Failed to fetch teams: ${teamsError.message}`);
  }

  // Validate: ≥2 teams with ≥1 player each, each team has a leader
  const validTeams = teams?.filter(team => 
    team.players && team.players.length > 0
  ) || [];

  if (validTeams.length < 2) {
    throw new Error('Need at least 2 teams with players to start tournament');
  }

  // Check each team has a leader
  for (const team of validTeams) {
    const hasLeader = team.players.some((player: Player) => player.is_leader);
    if (!hasLeader) {
      throw new Error(`Team "${team.name}" needs a leader before starting`);
    }
  }

  // Set current_pick_team to first team (by created_at)
  const firstTeam = validTeams.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0];

  // Update tournament status to 'picking'
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .update({
      status: 'picking',
      current_pick_team: firstTeam.id
    })
    .eq('id', tournamentId)
    .select()
    .single();

  if (error || !tournament) {
    throw new Error(`Failed to start tournament: ${error?.message}`);
  }

  return tournament;
}