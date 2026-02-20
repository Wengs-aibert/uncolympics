import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrCreateDeviceId } from '../lib/device'
import { reconnectPlayer } from '../lib/api'
import useGameStore from '../stores/gameStore'

export function useReconnect() {
  const navigate = useNavigate()
  const { setTournament, setCurrentPlayer } = useGameStore()

  useEffect(() => {
    const attemptReconnect = async () => {
      try {
        const deviceId = getOrCreateDeviceId()
        const result = await reconnectPlayer(deviceId)
        
        if (result) {
          const { tournament, player } = result
          setTournament(tournament)
          setCurrentPlayer(player)
          
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
  }, [navigate, setTournament, setCurrentPlayer])
}