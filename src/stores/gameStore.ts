// Thin re-export of all store slices for backward compatibility
// This file exports the individual stores and provides a combined interface

import useLobbyStore from './lobbyStore'
import useGamePlayStore from './gamePlayStore' 
import useTitleStore from './titleStore'
import useCeremonyStore from './ceremonyStore'
import useScoreboardStore from './scoreboardStore'

// Create a combined store object that mimics the old interface
const useGameStore = () => {
  const lobbyStore = useLobbyStore()
  const gamePlayStore = useGamePlayStore()
  const titleStore = useTitleStore()
  const ceremonyStore = useCeremonyStore()
  const scoreboardStore = useScoreboardStore()

  return {
    // Lobby store state and actions
    ...lobbyStore,
    
    // GamePlay store state and actions  
    ...gamePlayStore,
    
    // Title store state and actions
    ...titleStore,
    
    // Ceremony store state and actions
    ...ceremonyStore,
    
    // Scoreboard store state and actions
    ...scoreboardStore,
    
    // Combined reset action that resets all stores
    reset: () => {
      // Reset lobby store
      lobbyStore.setTournament(null as any)
      lobbyStore.setCurrentPlayer(null as any) 
      lobbyStore.setPlayers([])
      lobbyStore.setTeams([])
      lobbyStore.setVotes([])
      lobbyStore.setConnectionStatus(null as any)
      
      // Reset gameplay store
      gamePlayStore.setGame(null)
      gamePlayStore.setCurrentGameStats([])
      gamePlayStore.setCurrentGameResult(null)
      gamePlayStore.setAvailableGames([])
      gamePlayStore.setPickedGames([])
      gamePlayStore.setCurrentPickTeam(null)
      gamePlayStore.setCurrentRound(1)
      gamePlayStore.clearGameState()
      
      // Reset title store  
      titleStore.setGameTitles([])
      titleStore.resetReveal()
      titleStore.setIsLastGame(false)
      
      // Reset ceremony store
      ceremonyStore.setGlobalTitles([])
      ceremonyStore.setWinningTeam(null)
      ceremonyStore.setIsTied(false)
      ceremonyStore.setCeremonyPhase('loading')
      
      // Reset scoreboard store
      scoreboardStore.setScoreboardData(null)
      scoreboardStore.setSelectedPlayer(null)
    }
  }
}

// Add getState method to match Zustand API
useGameStore.getState = () => {
  const lobbyState = useLobbyStore.getState()
  const gamePlayState = useGamePlayStore.getState()
  const titleState = useTitleStore.getState()
  const ceremonyState = useCeremonyStore.getState()
  const scoreboardState = useScoreboardStore.getState()

  return {
    ...lobbyState,
    ...gamePlayState,
    ...titleState,
    ...ceremonyState,
    ...scoreboardState,
    reset: () => {
      // Reset all stores
      lobbyState.setTournament(null as any)
      lobbyState.setCurrentPlayer(null as any) 
      lobbyState.setPlayers([])
      lobbyState.setTeams([])
      lobbyState.setVotes([])
      lobbyState.setConnectionStatus(null as any)
      
      gamePlayState.setGame(null)
      gamePlayState.setCurrentGameStats([])
      gamePlayState.setCurrentGameResult(null)
      gamePlayState.setAvailableGames([])
      gamePlayState.setPickedGames([])
      gamePlayState.setCurrentPickTeam(null)
      gamePlayState.setCurrentRound(1)
      gamePlayState.clearGameState()
      
      titleState.setGameTitles([])
      titleState.resetReveal()
      titleState.setIsLastGame(false)
      
      ceremonyState.setGlobalTitles([])
      ceremonyState.setWinningTeam(null)
      ceremonyState.setIsTied(false)
      ceremonyState.setCeremonyPhase('loading')
      
      scoreboardState.setScoreboardData(null)
      scoreboardState.setSelectedPlayer(null)
    }
  }
}

export default useGameStore

// Also export individual stores for direct usage
export { useLobbyStore, useGamePlayStore, useTitleStore, useCeremonyStore, useScoreboardStore }