import { supabase } from './supabase'
import type { PlayerStat } from '../types'

export interface GlobalTitleResult {
  playerId: string
  titleName: string
  titleDesc: string
  isFunny: boolean
  points: number
}

/**
 * Calculate tournament-wide global titles.
 * These are awarded at the ceremony after all games are complete.
 * Global titles have game_id = null in the titles table.
 */
export async function calculateGlobalTitles(tournamentId: string): Promise<GlobalTitleResult[]> {
  // Fetch all data needed for global title calculations
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('tournament_id', tournamentId)
    .not('team_id', 'is', null)

  if (playersError) throw new Error(`Failed to fetch players: ${playersError.message}`)

  const { data: titles, error: titlesError } = await supabase
    .from('titles')
    .select('*')
    .eq('tournament_id', tournamentId)
    .not('game_id', 'is', null) // Only game-level titles

  if (titlesError) throw new Error(`Failed to fetch titles: ${titlesError.message}`)

  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('status', 'completed')
    .order('game_order')

  if (gamesError) throw new Error(`Failed to fetch games: ${gamesError.message}`)

  // Fetch all player_stats for all games
  const gameIds = (games || []).map(g => g.id)
  let allStats: PlayerStat[] = []
  if (gameIds.length > 0) {
    const { data: stats, error: statsError } = await supabase
      .from('player_stats')
      .select('*')
      .in('game_id', gameIds)

    if (statsError) throw new Error(`Failed to fetch stats: ${statsError.message}`)
    allStats = stats || []
  }

  const playerList = players || []
  const titleList = titles || []
  const gameList = games || []
  const results: GlobalTitleResult[] = []

  if (playerList.length === 0 || gameList.length === 0) return results

  // --- MVP: Most total titles ---
  const titleCountByPlayer = new Map<string, number>()
  for (const t of titleList) {
    titleCountByPlayer.set(t.player_id, (titleCountByPlayer.get(t.player_id) || 0) + 1)
  }
  if (titleCountByPlayer.size > 0) {
    const maxTitles = Math.max(...titleCountByPlayer.values())
    if (maxTitles > 0) {
      for (const [playerId, count] of titleCountByPlayer) {
        if (count === maxTitles) {
          results.push({
            playerId,
            titleName: 'MVP',
            titleDesc: `Earned the most titles in the tournament (${count})`,
            isFunny: false,
            points: 1.0
          })
        }
      }
    }
  }

  // --- Late Bloomer: Most titles in the last game ---
  if (gameList.length > 0) {
    const lastGame = gameList[gameList.length - 1]
    const lastGameTitles = titleList.filter(t => t.game_id === lastGame.id)
    const lastGameTitleCount = new Map<string, number>()
    for (const t of lastGameTitles) {
      lastGameTitleCount.set(t.player_id, (lastGameTitleCount.get(t.player_id) || 0) + 1)
    }
    if (lastGameTitleCount.size > 0) {
      const maxLast = Math.max(...lastGameTitleCount.values())
      if (maxLast > 0) {
        for (const [playerId, count] of lastGameTitleCount) {
          if (count === maxLast) {
            // Only award if they weren't already dominant throughout
            const totalTitles = titleCountByPlayer.get(playerId) || 0
            const isLateBloom = lastGameTitles.length > 0 && count >= Math.ceil(totalTitles * 0.4)
            if (isLateBloom) {
              results.push({
                playerId,
                titleName: 'Late Bloomer',
                titleDesc: `Peaked at the perfect time — ${count} title(s) in the final game`,
                isFunny: false,
                points: 0.5
              })
            }
          }
        }
      }
    }
  }

  // --- Title Hoarder: Most titles earned by players on one team ---
  const titlesByTeam = new Map<string, number>()
  for (const t of titleList) {
    const player = playerList.find(p => p.id === t.player_id)
    if (player?.team_id) {
      titlesByTeam.set(player.team_id, (titlesByTeam.get(player.team_id) || 0) + 1)
    }
  }
  if (titlesByTeam.size > 0) {
    const maxTeamTitles = Math.max(...titlesByTeam.values())
    if (maxTeamTitles > 0) {
      for (const [teamId, count] of titlesByTeam) {
        if (count === maxTeamTitles) {
          // Award to all players on that team
          const teamPlayers = playerList.filter(p => p.team_id === teamId)
          for (const p of teamPlayers) {
            // Only award to players who actually earned titles
            if ((titleCountByPlayer.get(p.id) || 0) > 0) {
              results.push({
                playerId: p.id,
                titleName: 'Title Hoarder',
                titleDesc: `Part of the team that hoarded the most titles (${count} total)`,
                isFunny: false,
                points: 0.5
              })
            }
          }
        }
      }
    }
  }

  // --- Iron Man: Submitted stats in every game ---
  for (const player of playerList) {
    const gamesWithStats = new Set(
      allStats.filter(s => s.player_id === player.id).map(s => s.game_id)
    )
    if (gamesWithStats.size >= gameList.length && gameList.length > 1) {
      results.push({
        playerId: player.id,
        titleName: 'Iron Man',
        titleDesc: `Submitted stats in every single game (${gameList.length}/${gameList.length})`,
        isFunny: false,
        points: 0.5
      })
    }
  }

  // --- Ghost: Player who earned zero titles all tournament ---
  for (const player of playerList) {
    const playerTitleCount = titleCountByPlayer.get(player.id) || 0
    if (playerTitleCount === 0) {
      results.push({
        playerId: player.id,
        titleName: 'Ghost',
        titleDesc: 'Went the entire tournament without earning a single title',
        isFunny: true,
        points: 0.5
      })
    }
  }

  // --- Versatile: Earned titles in the most different games ---
  const gamesWithTitlesByPlayer = new Map<string, Set<string>>()
  for (const t of titleList) {
    if (!t.game_id) continue
    if (!gamesWithTitlesByPlayer.has(t.player_id)) {
      gamesWithTitlesByPlayer.set(t.player_id, new Set())
    }
    gamesWithTitlesByPlayer.get(t.player_id)!.add(t.game_id)
  }
  if (gamesWithTitlesByPlayer.size > 0) {
    const maxGames = Math.max(...[...gamesWithTitlesByPlayer.values()].map(s => s.size))
    if (maxGames > 1) {
      for (const [playerId, gameSet] of gamesWithTitlesByPlayer) {
        if (gameSet.size === maxGames) {
          results.push({
            playerId,
            titleName: 'Versatile',
            titleDesc: `Earned titles across ${maxGames} different games`,
            isFunny: false,
            points: 0.5
          })
        }
      }
    }
  }

  // --- Class Clown: Most funny titles ---
  const funnyTitleCount = new Map<string, number>()
  for (const t of titleList) {
    if (t.is_funny) {
      funnyTitleCount.set(t.player_id, (funnyTitleCount.get(t.player_id) || 0) + 1)
    }
  }
  if (funnyTitleCount.size > 0) {
    const maxFunny = Math.max(...funnyTitleCount.values())
    if (maxFunny > 0) {
      for (const [playerId, count] of funnyTitleCount) {
        if (count === maxFunny) {
          results.push({
            playerId,
            titleName: 'Class Clown',
            titleDesc: `Earned the most funny titles (${count})`,
            isFunny: true,
            points: 0.5
          })
        }
      }
    }
  }

  return results
}
