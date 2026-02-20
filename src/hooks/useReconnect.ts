import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrCreateDeviceId } from '../lib/device'
import { reconnectPlayer, fetchLobbyState } from '../lib/api'
import { subscribeTournament } from '../lib/sync'
import useLobbyStore from '../stores/lobbyStore'

export function useReconnect() {
  const navigate = useNavigate()
  const { setTournament, setCurrentPlayer, setPlayers, setTeams, setVotes } = useLobbyStore()

  useEffect(() => {
    const attemptReconnect = async () => {
      try {
        const deviceId = getOrCreateDeviceId()
        const result = await reconnectPlayer(deviceId)
        
        if (result) {
          const { tournament, player } = result
          setTournament(tournament)
          setCurrentPlayer(player)
          
          // If reconnecting to lobby, also load lobby state and setup real-time sync
          if (tournament.status === 'lobby') {
            try {
              const lobbyState = await fetchLobbyState(tournament.id)
              setPlayers(lobbyState.players)
              setTeams(lobbyState.teams)
              setVotes(lobbyState.votes)
              
              // Setup real-time sync for lobby
              subscribeTournament(tournament.id)
            } catch (error) {
              console.error('Failed to load lobby state on reconnect:', error)
            }
          }
          
          // Navigate based on tournament status
          switch (tournament.status) {
            case 'lobby':
              navigate(`/lobby/${tournament.room_code}`)
              break
            case 'picking':
              navigate(`/game/${tournament.room_code}/pick`)
              break
            case 'playing':
              // Would need current game info to navigate to specific game
              navigate(`/lobby/${tournament.room_code}`)
              break
            case 'scoring':
              navigate(`/scoreboard/${tournament.room_code}`)
              break
            case 'completed':
              navigate(`/ceremony/${tournament.room_code}`)
              break
            default:
              navigate(`/lobby/${tournament.room_code}`)
          }
        }
        // If no result, do nothing (stay on current page)
      } catch (error) {
        console.error('Reconnect failed:', error)
        // Silently fail - user can manually join/create
      }
    }

    attemptReconnect()
  }, [navigate, setTournament, setCurrentPlayer, setPlayers, setTeams, setVotes])
}