import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createTournament } from '../lib/api'
import { getOrCreateDeviceId } from '../lib/device'
import useGameStore from '../stores/gameStore'

function CreateTournament() {
  const navigate = useNavigate()
  const { setTournament, setCurrentPlayer } = useGameStore()
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
  const [error, setError] = useState('')
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
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

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
      navigate(`/lobby/${result.tournament.room_code}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tournament'
      setError(errorMessage)
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative space-y-16">
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

      {/* Red circle button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="absolute top-8 right-8"
      >
        <button
          onClick={handleCreate}
          disabled={loading || !formData.refereeName.trim() || !formData.roomCode.trim()}
          className="btn-red disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳' : '🔴'}
        </button>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="glass-panel p-4 bg-red-500/20 border-red-500/30">
            <p className="text-red-300 text-center text-sm">{error}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default CreateTournament