import { supabase } from '../supabase'
import { fetchFullTournamentData } from './shared'
import type { Tournament, Team, TitleWithPlayer, GameWithType } from '../../types'

/**
 * Fetch all completed tournaments with teams and winner — batched (no N+1).
 */
export async function fetchTournamentHistory(): Promise<{
  tournament: Tournament;
  teams: { name: string; total_points: number }[];
  winningTeam: { name: string; total_points: number } | null;
  isTied: boolean;
}[]> {
  // 1. All completed tournaments
  const { data: tournaments, error } = await supabase
    .from('tournaments').select('*')
    .eq('status', 'completed').order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to fetch tournament history: ${error.message}`)
  if (!tournaments || tournaments.length === 0) return []

  // 2. Batch fetch ALL teams for ALL completed tournaments in one query (fixes N+1)
  const tournamentIds = tournaments.map(t => t.id)
  const { data: allTeams, error: teamsError } = await supabase
    .from('teams').select('tournament_id, name, total_points')
    .in('tournament_id', tournamentIds)
    .order('total_points', { ascending: false })
  if (teamsError) throw new Error(`Failed to fetch teams: ${teamsError.message}`)

  // 3. Group teams by tournament
  const teamsByTournament = new Map<string, { name: string; total_points: number }[]>()
  ;(allTeams || []).forEach(team => {
    const list = teamsByTournament.get(team.tournament_id) || []
    list.push({ name: team.name, total_points: team.total_points })
    teamsByTournament.set(team.tournament_id, list)
  })

  // 4. Build results
  return tournaments.map(tournament => {
    const teamList = teamsByTournament.get(tournament.id) || []
    let winningTeam: { name: string; total_points: number } | null = null
    let isTied = false

    if (teamList.length >= 2) {
      if (teamList[0].total_points > teamList[1].total_points) {
        winningTeam = teamList[0]
      } else if (teamList[0].total_points === teamList[1].total_points) {
        isTied = true
      }
    } else if (teamList.length === 1) {
      winningTeam = teamList[0]
    }

    return { tournament, teams: teamList, winningTeam, isTied }
  })
}

/**
 * Fetch full detail for a completed tournament — uses shared fetcher.
 */
export async function fetchTournamentDetail(tournamentId: string): Promise<{
  tournament: Tournament; teams: Team[]; players: any[];
  games: GameWithType[]; titles: TitleWithPlayer[];
  winningTeam: Team | null; isTied: boolean;
}> {
  const data = await fetchFullTournamentData(tournamentId)
  return {
    tournament: data.tournament,
    teams: data.teams,
    players: data.players,
    games: data.games,
    titles: data.allTitles,
    winningTeam: data.winningTeam,
    isTied: data.isTied
  }
}
