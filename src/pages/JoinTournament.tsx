import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { joinTournament } from '../lib/api'
import { getOrCreateDeviceId } from '../lib/device'
import useGameStore from '../stores/gameStore'

function JoinTournament() {
  const navigate = useNavigate()
  const { setTournament, setCurrentPlayer } = useGameStore()
  const nameRef = useRef<HTMLDivElement>(null)
  const lobbyRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    document.title = 'UNCOLYMPICS - Join Tournament';
  }, []);
  
  const [formData, setFormData] = useState({
    playerName: '',
    roomCode: ''
  })
  const [error, setError] = useState('')
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
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

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
      navigate(`/lobby/${result.tournament.room_code}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join tournament'
      
      if (errorMessage.includes('Room not found') || errorMessage.includes('Invalid room code')) {
        setError('Room not found. Check your lobby code.')
      } else if (errorMessage.includes('already started')) {
        setError('Tournament has already started.')
      } else {
        setError(errorMessage)
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative">
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

      {/* Red circle button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="absolute top-8 right-8"
      >
        <button
          onClick={handleJoin}
          disabled={loading || !formData.playerName.trim() || !formData.roomCode.trim()}
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

export default JoinTournament