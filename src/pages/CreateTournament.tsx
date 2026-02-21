import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createTournament } from '../lib/api'
import { getOrCreateDeviceId } from '../lib/device'
import useLobbyStore from '../stores/lobbyStore'
import { toast } from '../lib/toast'
import { useSwipeUp } from '../hooks/useSwipeUp'
import { SwipeHint } from '../components/ui/SwipeHint'

function CreateTournament() {
  const navigate = useNavigate()
  const { setTournament, setCurrentPlayer } = useLobbyStore()
  const refNameRef = useRef<HTMLDivElement>(null)
  const gamesRef = useRef<HTMLDivElement>(null)
  const lobbyRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    document.title = 'UNCOLYMPICS - Create Tournament';
  }, []);
  
  const [formData, setFormData] = useState({
    refereeName: '',
    numGames: 3,
    roomCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [refNameEditing, setRefNameEditing] = useState(false)
  const [gamesEditing, setGamesEditing] = useState(false)
  const [lobbyEditing, setLobbyEditing] = useState(false)

  const validateForm = (): string | null => {
    if (!formData.refereeName.trim()) return 'Ref name is required'
    if (!formData.roomCode.trim()) return 'Lobby code is required'
    if (formData.roomCode.length > 5) return 'Lobby code must be 5 characters or less'
    if (!/^[A-Z0-9]+$/.test(formData.roomCode)) return 'Lobby code must be alphanumeric'
    if (formData.numGames < 1 || formData.numGames > 10) return 'Games must be between 1 and 10'
    return null
  }

  const handleCreate = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setLoading(true)

    try {
      const deviceId = getOrCreateDeviceId()
      // Generate tournament name based on ref name and lobby code
      const tournamentName = `${formData.refereeName}'s Tournament`
      
      const result = await createTournament(
        tournamentName,
        formData.roomCode.trim().toUpperCase(),
        formData.numGames,
        formData.refereeName.trim(),
        deviceId
      )

      setTournament(result.tournament)
      setCurrentPlayer(result.player)
      toast.success('Tournament created!')
      navigate(`/lobby/${result.tournament.room_code}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tournament'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRefNameClick = () => {
    setRefNameEditing(true)
    setTimeout(() => refNameRef.current?.focus(), 0)
  }

  const handleGamesClick = () => {
    setGamesEditing(true)
    setTimeout(() => gamesRef.current?.focus(), 0)
  }

  const handleLobbyClick = () => {
    setLobbyEditing(true)
    setTimeout(() => lobbyRef.current?.focus(), 0)
  }

  const handleRefNameBlur = () => {
    setRefNameEditing(false)
  }

  const handleGamesBlur = () => {
    setGamesEditing(false)
  }

  const handleLobbyBlur = () => {
    setLobbyEditing(false)
  }

  const handleRefNameInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setFormData(prev => ({ ...prev, refereeName: target.textContent || '' }))
  }

  const handleGamesInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const value = parseInt(target.textContent || '3')
    if (!isNaN(value) && value >= 1 && value <= 10) {
      setFormData(prev => ({ ...prev, numGames: value }))
    }
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
    onSwipe: handleCreate,
    enabled: !loading && formData.refereeName.trim() !== '' && formData.roomCode.trim() !== ''
  })

  return (
    <div ref={swipeHintRef} className="flex flex-col items-center justify-center min-h-screen relative space-y-16">
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
      >
        <div
          ref={refNameRef}
          contentEditable={refNameEditing}
          suppressContentEditableWarning={true}
          onClick={handleRefNameClick}
          onBlur={handleRefNameBlur}
          onInput={handleRefNameInput}
          className="seamless-editable text-6xl md:text-7xl font-heading text-primary text-center cursor-pointer"
          data-placeholder="Ref Name"
        >
          {!refNameEditing && formData.refereeName ? formData.refereeName : ''}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div
          ref={gamesRef}
          contentEditable={gamesEditing}
          suppressContentEditableWarning={true}
          onClick={handleGamesClick}
          onBlur={handleGamesBlur}
          onInput={handleGamesInput}
          className="seamless-editable text-6xl md:text-7xl font-heading text-primary text-center cursor-pointer"
          data-placeholder="Games"
        >
          {!gamesEditing && formData.numGames ? formData.numGames.toString() : ''}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
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
        visible={!loading} 
        text={
          formData.refereeName.trim() !== '' && formData.roomCode.trim() !== ''
            ? "↑ Swipe up to create"
            : "Fill ref name & lobby code first"
        }
      />

    </div>
  )
}

export default CreateTournament