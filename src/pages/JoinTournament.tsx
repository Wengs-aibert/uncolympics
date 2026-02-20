import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { joinTournament } from '../lib/api'
import { getOrCreateDeviceId } from '../lib/device'
import useLobbyStore from '../stores/lobbyStore'
import { toast } from '../lib/toast'
import { useSwipeUp } from '../hooks/useSwipeUp'
import { SwipeHint } from '../components/ui/SwipeHint'

function JoinTournament() {
  const navigate = useNavigate()
  const { setTournament, setCurrentPlayer } = useLobbyStore()
  const nameRef = useRef<HTMLDivElement>(null)
  const lobbyRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    document.title = 'UNCOLYMPICS - Join Tournament';
  }, []);
  
  const [formData, setFormData] = useState({
    playerName: '',
    roomCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [nameEditing, setNameEditing] = useState(false)
  const [lobbyEditing, setLobbyEditing] = useState(false)

  const validateForm = (): string | null => {
    if (!formData.roomCode.trim()) return 'Lobby code is required'
    if (!formData.playerName.trim()) return 'Name is required'
    if (formData.roomCode.length > 5) return 'Lobby code must be 5 characters or less'
    if (!/^[A-Z0-9]+$/.test(formData.roomCode)) return 'Lobby code must be alphanumeric'
    return null
  }

  const handleJoin = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setLoading(true)

    try {
      const deviceId = getOrCreateDeviceId()
      const result = await joinTournament(
        formData.roomCode.trim().toUpperCase(),
        formData.playerName.trim(),
        deviceId,
        'player'
      )

      setTournament(result.tournament)
      setCurrentPlayer(result.player)
      toast.success('Joined tournament!')
      navigate(`/lobby/${result.tournament.room_code}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join tournament'
      
      if (errorMessage.includes('Room not found') || errorMessage.includes('Invalid room code')) {
        toast.error('Room not found. Check your lobby code.')
      } else if (errorMessage.includes('already started')) {
        toast.error('Tournament has already started.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNameClick = () => {
    setNameEditing(true)
    setTimeout(() => nameRef.current?.focus(), 0)
  }

  const handleLobbyClick = () => {
    setLobbyEditing(true)
    setTimeout(() => lobbyRef.current?.focus(), 0)
  }

  const handleNameBlur = () => {
    setNameEditing(false)
  }

  const handleLobbyBlur = () => {
    setLobbyEditing(false)
  }

  const handleNameInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setFormData(prev => ({ ...prev, playerName: target.textContent || '' }))
  }

  const handleLobbyInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setFormData(prev => ({ ...prev, roomCode: (target.textContent || '').toUpperCase() }))
  }

  const handleBackNavigation = () => {
    navigate('/')
  }

  // Add swipe-up functionality
  const { swipeHintRef } = useSwipeUp({
    onSwipe: handleJoin,
    enabled: !loading && formData.playerName.trim() !== '' && formData.roomCode.trim() !== ''
  })

  return (
    <div ref={swipeHintRef} className="flex flex-col items-center justify-center min-h-screen relative">
      {/* Back navigation */}
      <button
        onClick={handleBackNavigation}
        className="absolute top-8 left-8 text-secondary hover:text-primary transition-colors text-2xl"
      >
        ←
      </button>

      {/* Animated elements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-12"
      >
        <div
          ref={nameRef}
          contentEditable={nameEditing}
          suppressContentEditableWarning={true}
          onClick={handleNameClick}
          onBlur={handleNameBlur}
          onInput={handleNameInput}
          className="seamless-editable text-6xl md:text-7xl font-heading text-primary text-center cursor-pointer"
          data-placeholder="Name"
        >
          {!nameEditing && formData.playerName ? formData.playerName : ''}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-12"
      >
        <div
          ref={lobbyRef}
          contentEditable={lobbyEditing}
          suppressContentEditableWarning={true}
          onClick={handleLobbyClick}
          onBlur={handleLobbyBlur}
          onInput={handleLobbyInput}
          className="seamless-editable text-6xl md:text-7xl font-heading text-primary text-center cursor-pointer tracking-wider"
          data-placeholder="Lobby #"
          style={{ textTransform: 'uppercase' }}
        >
          {!lobbyEditing && formData.roomCode ? formData.roomCode : ''}
        </div>
      </motion.div>

      {/* Swipe hint */}
      <SwipeHint 
        visible={!loading && formData.playerName.trim() !== '' && formData.roomCode.trim() !== ''} 
        text="↑ Swipe up"
      />

    </div>
  )
}

export default JoinTournament