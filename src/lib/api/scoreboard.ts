import { supabase } from '../supabase'
import { fetchFullTournamentData } from './shared'
import type { ScoreboardData, PlayerDetail, GameWithType, GameResult, GameType } from '../../types'

export async function fetchScoreboard(tournamentId: string): Promise<ScoreboardData> {
  const data = await fetchFullTournamentData(tournamentId)
  return {
    tournament: data.tournament,
    teams: data.teams,
    players: data.players,
    games: data.games,
    titles: data.allTitles,
    playerStats: data.playerStats,
    titleLeaderboard: data.titleLeaderboard
  }
}

export async function fetchPlayerDetail(playerId: string, tournamentId: string): Promise<PlayerDetail> {
  const { data: player, error: playerError } = await supabase
    .from('players').select('*').eq('id', playerId).single()
  if (playerError || !player) throw new Error(`Failed to fetch player: ${playerError?.message}`)

  const { data: allGames, error: gamesError } = await supabase
    .from('games').select(`*, game_type:game_types(*)`)
    .eq('tournament_id', tournamentId).order('game_order')
  if (gamesError) throw new Error(`Failed to fetch games: ${gamesError.message}`)

  const gameIds = (allGames || []).map(game => game.id)
  let gameResults: GameResult[] = []
  if (gameIds.length > 0) {
    const { data: results, error: resultsError } = await supabase
      .from('game_results').select('*').in('game_id', gameIds)
    if (resultsError) throw new Error(`Failed to fetch game results: ${resultsError.message}`)
    gameResults = results || []
  }

  const { data: teams, error: teamsError } = await supabase
    .from('teams').select('*').eq('tournament_id', tournamentId)
  if (teamsError) throw new Error(`Failed to fetch teams: ${teamsError.message}`)

  let playerStats: any[] = []
  if (gameIds.length > 0) {
    const { data: stats, error: statsError } = await supabase
      .from('player_stats').select('*').eq('player_id', playerId)
      .in('game_id', gameIds).order('submitted_at')
    if (!statsError) playerStats = stats || []
  }

  const { data: titles, error: titlesError } = await supabase
    .from('titles').select('*').eq('player_id', playerId)
    .eq('tournament_id', tournamentId).order('created_at')
  if (titlesError) throw new Error(`Failed to fetch titles: ${titlesError.message}`)

  const gamesWithType: GameWithType[] = (allGames || []).map(game => {
    const result = gameResults.find(r => r.game_id === game.id)
    const winningTeam = result?.winning_team_id
      ? (teams || []).find(t => t.id === result.winning_team_id)
      : null
    return { ...game, gameType: game.game_type as GameType, winnerName: winningTeam?.name }
  })

  const statsByGame = gamesWithType
    .map(game => ({ game, stats: playerStats.filter(stat => stat.game_id === game.id) }))
    .filter(entry => entry.stats.length > 0)

  const pointsContributed = (titles || []).reduce((sum, title) => sum + title.points, 0)

  return { player, statsByGame, titles: titles || [], pointsContributed }
}
