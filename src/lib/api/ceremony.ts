import { fetchFullTournamentData } from './shared'
import type { CeremonyData } from '../../types'

export async function fetchCeremonyData(tournamentId: string): Promise<CeremonyData> {
  const data = await fetchFullTournamentData(tournamentId)
  return {
    tournament: data.tournament,
    teams: data.teams,
    players: data.players,
    games: data.games,
    allTitles: data.allTitles,
    globalTitles: data.globalTitles,
    winningTeam: data.winningTeam,
    isTied: data.isTied,
    titleLeaderboard: data.titleLeaderboard
  }
}
