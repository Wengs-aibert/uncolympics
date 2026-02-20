// Tournament and Player types (existing in store/api)
export interface Tournament {
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

export interface Player {
  id: string
  tournament_id: string
  name: string
  device_id: string
  team_id: string | null
  role: 'referee' | 'player' | 'spectator'
  is_leader: boolean
  created_at: string
}

export interface Team {
  id: string
  tournament_id: string
  name: string
  total_points: number
  created_at: string
}

export interface Game {
  id: string
  tournament_id: string
  game_type_id: string
  status: 'pending' | 'active' | 'scoring' | 'titles' | 'completed'
  picked_by_team: string
  game_order: number
  created_at: string
}

export interface Title {
  id: string
  tournament_id: string
  game_id: string | null
  player_id: string
  title_name: string
  title_desc: string
  is_funny: boolean
  points: number
}

export interface PlayerStat {
  id: string
  game_id: string
  player_id: string
  stat_key: string
  stat_value: number
  submitted_at: string
}

// New Sprint 2 type
export interface LeaderVote {
  id: string
  team_id: string
  voter_id: string
  candidate_id: string
  created_at: string
}